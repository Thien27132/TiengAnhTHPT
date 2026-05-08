const sql = require('mssql');

const buildInClause = (values, request) => {
    if (!Array.isArray(values) || values.length === 0) return '(NULL)';
    return values.map((value, index) => {
        request.input(`id${index}`, sql.Int, value);
        return `@id${index}`;
    }).join(', ');
};

const createExam = async (req, res) => {
    const { examName, duration, level, adminId, totalQuestions, selectedQuestionIds } = req.body;

    try {
        const examResult = await sql.query`
            INSERT INTO Exams (ExamName, Duration, TotalQuestions, CreatedBy, Level)
            OUTPUT INSERTED.ExamID
            VALUES (${examName}, ${duration || 50}, ${totalQuestions || 40}, ${adminId}, ${level})`;
        
        const examId = examResult.recordset[0].ExamID;
        let finalQuestionIds = [];

        if (selectedQuestionIds && Array.isArray(selectedQuestionIds) && selectedQuestionIds.length > 0) {
            const request = new sql.Request();
            const inClause = buildInClause(selectedQuestionIds, request);
            const queryText = `
                SELECT QuestionID FROM Questions
                WHERE QuestionID IN (${inClause}) OR ParentID IN (${inClause})
                ORDER BY IsPassage DESC, QuestionID ASC`;
            const result = await request.query(queryText);
            finalQuestionIds = result.recordset.map(q => q.QuestionID);
        } else {
            const matrix = [
                { type: 'Leaflet', count: 2 },
                { type: 'Ordering', count: 1 },
                { type: 'Context_Filling', count: 1 },
                { type: 'Reading_8', count: 1 },
                { type: 'Reading_10', count: 1 }
            ];

            for (const item of matrix) {
                const randomPassages = await sql.query`
                    SELECT TOP (${item.count}) QuestionID FROM Questions 
                    WHERE QuestionType = ${item.type} AND IsPassage = 1 AND Level = ${level}
                    ORDER BY NEWID()`;

                if (randomPassages.recordset.length > 0) {
                    for (const p of randomPassages.recordset) {
                        const pId = p.QuestionID;
                        const relatedQuestions = await sql.query`
                            SELECT QuestionID FROM Questions 
                            WHERE QuestionID = ${pId} 
                            OR ParentID = ${pId}
                            ORDER BY IsPassage DESC, QuestionID ASC`;
                        finalQuestionIds.push(...relatedQuestions.recordset.map(q => q.QuestionID));
                    }
                }
            }
        }

        if (finalQuestionIds.length > 0) {
            for (let i = 0; i < finalQuestionIds.length; i++) {
                await sql.query`
                    INSERT INTO Exam_Questions (ExamID, QuestionID, QuestionOrder, Point)
                    VALUES (${examId}, ${finalQuestionIds[i]}, ${i + 1}, 0.25)`;
            }
        }

        res.status(201).json({ 
            message: 'Tạo đề thành công!', 
            examId, 
            totalInserted: finalQuestionIds.length 
        });
    } catch (err) {
        console.error('createExam error:', err);
        res.status(500).json({ message: 'Lỗi tạo đề', error: err.message });
    }
};

const submitExam = async (req, res) => {
    const { examId, studentId, completedTime, userAnswers } = req.body;
    const parsedExamId = Number(examId);
    const parsedStudentId = Number(studentId);
    const parsedCompletedTime = Math.max(0, Math.floor(Number(completedTime) || 0));
    const answersArray = Array.isArray(userAnswers) ? userAnswers : [];

    if (!parsedExamId || !parsedStudentId || parsedCompletedTime < 0) {
        return res.status(400).json({ message: 'Dữ liệu nộp bài không hợp lệ.' });
    }

    try {
        const examExists = await sql.query`SELECT ExamID FROM Exams WHERE ExamID = ${parsedExamId}`;
        if (examExists.recordset.length === 0) {
            return res.status(404).json({ message: 'Đề thi không tồn tại.' });
        }

        const correctAnswersResult = await sql.query`
            SELECT QuestionID, AnswerID 
            FROM Answers 
            WHERE IsCorrect = 1 AND QuestionID IN (
                SELECT QuestionID FROM Exam_Questions WHERE ExamID = ${parsedExamId}
            )`;

        const correctMap = {};
        correctAnswersResult.recordset.forEach(row => {
            correctMap[row.QuestionID] = row.AnswerID;
        });

        let correctCount = 0;
        const totalQuestions = Object.keys(correctMap).length;
        const details = [];

        answersArray.forEach(ans => {
            const isCorrect = correctMap[ans.questionId] === ans.selectedAnswerId;
            if (isCorrect) correctCount++;
            details.push({
                questionId: ans.questionId,
                selectedAnswerId: ans.selectedAnswerId,
                isCorrect: isCorrect ? 1 : 0,
                displayOrder: ans.displayOrder || null  // Include displayOrder from frontend
            });
        });

        const finalScore = totalQuestions > 0 ? (correctCount * 10) / totalQuestions : 0;

        const resultInsert = await sql.query`
            INSERT INTO ExamResults (ExamID, StudentID, Score, CompletedTime)
            OUTPUT INSERTED.ResultID
            VALUES (${parsedExamId}, ${parsedStudentId}, ${finalScore}, ${parsedCompletedTime})`;
        
        const resultId = resultInsert.recordset[0].ResultID;

        for (const detail of details) {
            await sql.query`
                INSERT INTO ResultDetail (ResultID, QuestionID, SelectedAnswerID, IsCorrect, DisplayOrder)
                VALUES (${resultId}, ${detail.questionId}, ${detail.selectedAnswerId}, ${detail.isCorrect}, ${detail.displayOrder})`;
        }

        res.status(200).json({
            message: 'Nộp bài thành công!',
            score: finalScore.toFixed(2),
            correctCount,
            totalQuestions,
            resultId
        });
    } catch (err) {
        console.error('submitExam error:', err);
        res.status(500).json({ message: 'Lỗi nộp bài', error: err.message });
    }
};

const getAllExams = async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Exams ORDER BY CreatedAt DESC`;
        res.json(result.recordset);
    } catch (err) {
        console.error('getAllExams error:', err);
        res.status(500).json({ message: 'Lỗi lấy danh sách đề', error: err.message });
    }
};

const getExamDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const examInfo = await sql.query`SELECT * FROM Exams WHERE ExamID = ${id}`;
        if (examInfo.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đề thi' });
        }

        const questions = await sql.query`
            SELECT q.QuestionID, q.Content, q.IsPassage, q.ParentID, q.QuestionType, eq.QuestionOrder
            FROM Questions q
            JOIN Exam_Questions eq ON q.QuestionID = eq.QuestionID
            WHERE eq.ExamID = ${id}
            ORDER BY eq.QuestionOrder ASC`;

        const answers = await sql.query`
            SELECT AnswerID, QuestionID, AnswerContent 
            FROM Answers 
            WHERE QuestionID IN (SELECT QuestionID FROM Exam_Questions WHERE ExamID = ${id})
            ORDER BY NEWID()`;

        res.json({
            exam: examInfo.recordset[0],
            questions: questions.recordset.map(q => {
                // Parse content for passage questions (JSON format)
                if (q.IsPassage) {
                    try {
                        const parsed = JSON.parse(q.Content);
                        if (parsed && typeof parsed === 'object') {
                            return {
                                ...q,
                                prompt: parsed.prompt || '',
                                passage: parsed.passage || ''
                            };
                        }
                    } catch (error) {
                        return {
                            ...q,
                            prompt: q.Content,
                            passage: ''
                        };
                    }
                }
                return q;
            }),
            answers: answers.recordset
        });
    } catch (err) {
        console.error('getExamDetail error:', err);
        res.status(500).json({ message: 'Lỗi lấy chi tiết đề', error: err.message });
    }
};

const getStudentExamHistory = async (req, res) => {
    const { studentId } = req.params;
    const { limit } = req.query;
    const parsedLimit = Number(limit) > 0 ? Number(limit) : null;

    try {
        const request = new sql.Request();
        request.input('StudentID', sql.Int, studentId);

        let queryText = `
            SELECT 
                er.ResultID,
                e.ExamID,
                e.ExamName,
                e.Level,
                er.Score,
                er.CompletedTime,
                er.CompletedAt
            FROM ExamResults er
            JOIN Exams e ON er.ExamID = e.ExamID
            WHERE er.StudentID = @StudentID
            ORDER BY er.CompletedAt DESC`;

        if (parsedLimit) {
            queryText = `
                SELECT TOP (${parsedLimit})
                    er.ResultID,
                    e.ExamID,
                    e.ExamName,
                    e.Level,
                    er.Score,
                    er.CompletedTime,
                    er.CompletedAt
                FROM ExamResults er
                JOIN Exams e ON er.ExamID = e.ExamID
                WHERE er.StudentID = @StudentID
                ORDER BY er.CompletedAt DESC`;
        }

        const result = await request.query(queryText);
        res.json(result.recordset);
    } catch (err) {
        console.error('getStudentExamHistory error:', err);
        res.status(500).json({ message: 'Lỗi lấy lịch sử thi', error: err.message });
    }
};

const getExamResultDetail = async (req, res) => {
    const { resultId } = req.params;
    try {
        // Get exam result info
        const resultInfo = await sql.query`
            SELECT 
                er.ResultID,
                er.ExamID,
                er.StudentID,
                er.Score,
                er.CompletedTime,
                er.CompletedAt,
                e.ExamName,
                e.Level,
                e.Duration
            FROM ExamResults er
            JOIN Exams e ON er.ExamID = e.ExamID
            WHERE er.ResultID = ${resultId}`;

        if (resultInfo.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy kết quả thi' });
        }

        const examResult = resultInfo.recordset[0];
        const examId = examResult.ExamID;

        // Get all exam questions (including passages)
        const allQuestions = await sql.query`
            SELECT 
                q.QuestionID,
                q.Content,
                q.IsPassage,
                q.ParentID,
                eq.QuestionOrder
            FROM Questions q
            LEFT JOIN Exam_Questions eq ON q.QuestionID = eq.QuestionID AND eq.ExamID = ${examId}
            WHERE q.QuestionID IN (
                SELECT QuestionID FROM Exam_Questions WHERE ExamID = ${examId}
            )
            ORDER BY eq.QuestionOrder ASC`;

        // Get all answers for these questions
        const questionIds = allQuestions.recordset.map(q => q.QuestionID);
        let allAnswers = [];
        
        if (questionIds.length > 0) {
            const answerRequest = new sql.Request();
            const idParams = questionIds.map((value, index) => {
                answerRequest.input(`qId${index}`, sql.Int, value);
                return `@qId${index}`;
            }).join(', ');

            const answersResult = await answerRequest.query(`
                SELECT 
                    AnswerID,
                    QuestionID,
                    AnswerContent,
                    IsCorrect,
                    Explanation
                FROM Answers
                WHERE QuestionID IN (${idParams})
                ORDER BY QuestionID ASC, AnswerID ASC`);
            allAnswers = answersResult.recordset.map(ans => ({
                ...ans,
                IsCorrect: ans.IsCorrect ? 1 : 0  // Convert boolean to 1/0
            }));
        }

        // Get student's answers (result details)
        const resultDetails = await sql.query`
            SELECT 
                rd.DetailID,
                rd.ResultID,
                rd.QuestionID,
                rd.SelectedAnswerID,
                rd.IsCorrect,
                rd.DisplayOrder
            FROM ResultDetail rd
            WHERE rd.ResultID = ${resultId}`;

        console.log('DEBUG - allAnswers:', allAnswers.slice(0, 5));
        console.log('DEBUG - resultDetails:', resultDetails.recordset.slice(0, 5));

        // Build comprehensive response
        const groupedQuestions = [];
        const questionMap = {};
        const answersByQuestion = {};
        const resultDetailMap = {};

        // Group answers by question
        allAnswers.forEach(ans => {
            if (!answersByQuestion[ans.QuestionID]) {
                answersByQuestion[ans.QuestionID] = [];
            }
            answersByQuestion[ans.QuestionID].push(ans);
        });

        // Map result details by question
        resultDetails.recordset.forEach(rd => {
            resultDetailMap[rd.QuestionID] = rd;
        });

        // Structure questions with all their data
        allQuestions.recordset.forEach(q => {
            questionMap[q.QuestionID] = {
                ...q,
                answers: answersByQuestion[q.QuestionID] || [],
                studentAnswer: resultDetailMap[q.QuestionID] || null
            };
        });

        // Organize passages with their child questions
        allQuestions.recordset.forEach(q => {
            if (q.IsPassage) {
                groupedQuestions.push({
                    type: 'passage',
                    data: questionMap[q.QuestionID]
                });

                // Find child questions
                allQuestions.recordset.forEach(childQ => {
                    if (childQ.ParentID === q.QuestionID) {
                        groupedQuestions.push({
                            type: 'question',
                            data: questionMap[childQ.QuestionID]
                        });
                    }
                });
            } else if (!q.ParentID) {
                // Standalone (non-passage) questions
                groupedQuestions.push({
                    type: 'question',
                    data: questionMap[q.QuestionID]
                });
            }
        });

        console.log('DEBUG - groupedQuestions count:', groupedQuestions.length);
        console.log('DEBUG - first question data:', groupedQuestions[0]?.data);

        res.json({
            examResults: [examResult],
            examInfo: examResult,
            questions: groupedQuestions
        });
    } catch (err) {
        console.error('getExamResultDetail error:', err);
        res.status(500).json({ message: 'Lỗi lấy chi tiết kết quả', error: err.message });
    }
};

const deleteExam = async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query`DELETE FROM ResultDetail WHERE ResultID IN (SELECT ResultID FROM ExamResults WHERE ExamID = ${id})`;
        await sql.query`DELETE FROM ExamResults WHERE ExamID = ${id}`;
        await sql.query`DELETE FROM Exam_Questions WHERE ExamID = ${id}`;
        await sql.query`DELETE FROM Exams WHERE ExamID = ${id}`;
        res.json({ message: 'Xóa đề thi thành công' });
    } catch (err) {
        console.error('deleteExam error:', err);
        res.status(500).json({ message: 'Lỗi xóa đề thi', error: err.message });
    }
};

module.exports = { createExam, submitExam, getAllExams, getExamDetail, deleteExam, getStudentExamHistory, getExamResultDetail };
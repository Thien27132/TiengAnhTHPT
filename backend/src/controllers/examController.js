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
            // Lấy tất cả các câu hỏi đã chọn mà không cần sắp xếp phức tạp theo thứ tự
            const queryText = `
                SELECT QuestionID, ParentID, IsPassage FROM Questions
                WHERE QuestionID IN (${inClause}) OR ParentID IN (${inClause})`;
            const result = await request.query(queryText);

            // Sắp xếp câu hỏi: đoạn văn trước, sau đó là các câu hỏi con của đoạn văn theo thứ tự
            const passages = [];
            const childQuestionsMap = {};

            result.recordset.forEach(q => {
                if (q.IsPassage) {
                    passages.push(q.QuestionID);
                    childQuestionsMap[q.QuestionID] = [];
                } else if (q.ParentID) {
                    if (!childQuestionsMap[q.ParentID]) {
                        childQuestionsMap[q.ParentID] = [];
                    }
                    childQuestionsMap[q.ParentID].push(q.QuestionID);
                }
            });

            // Xây dựng thứ tự cuối cùng: đoạn văn + các đoạn văn con của nó, lặp lại cho đoạn văn tiếp theo
            finalQuestionIds = [];
            for (const pId of passages) {
                finalQuestionIds.push(pId);
                if (childQuestionsMap[pId]) {
                    finalQuestionIds.push(...childQuestionsMap[pId]);
                }
            }
        } else {
            // Cấu trúc đề thi chuẩn:
            // 2 bài Leaflet (2 × 6 = 12 câu)
            // 1 bài Context_Filling (1 × 5 = 5 câu)
            // 1 bài Ordering (lấy đủ 5 câu con từ các bài Ordering)
            // 1 bài Reading_10 (1 × 10 = 10 câu)
            // 1 bài Reading_8 (1 × 8 = 8 câu)
            // Tổng: 40 câu

            const examStructure = [
                { type: 'Leaflet', passageCount: 2 },
                { type: 'Context_Filling', passageCount: 1 },
                { type: 'Ordering', passageCount: null, childCount: 5 }, // Ordering: lấy đủ 5 câu con
                { type: 'Reading_10', passageCount: 1 },
                { type: 'Reading_8', passageCount: 1 }
            ];

            for (const section of examStructure) {
                if (section.type === 'Ordering') {
                    // Ordering: mỗi bài lấy đủ 5 câu con
                    let orderingChildCount = 0;
                    const targetChildren = section.childCount;

                    const orderingPassages = await sql.query`
                        SELECT QuestionID FROM Questions 
                        WHERE QuestionType = 'Ordering' AND IsPassage = 1 AND Level = ${level}
                        ORDER BY NEWID()`;

                    for (const p of orderingPassages.recordset) {
                        if (orderingChildCount >= targetChildren) break;

                        const children = await sql.query`
                            SELECT QuestionID FROM Questions 
                            WHERE ParentID = ${p.QuestionID}
                            ORDER BY QuestionID ASC`;

                        // Chỉ lấy bài này nếu tổng câu con không vượt quá target
                        if (orderingChildCount + children.recordset.length <= targetChildren) {
                            finalQuestionIds.push(p.QuestionID);
                            finalQuestionIds.push(...children.recordset.map(q => q.QuestionID));
                            orderingChildCount += children.recordset.length;
                        } else if (orderingChildCount < targetChildren) {
                            // Nếu lấy hết bài sẽ vượt, vẫn lấy để đủ gần nhất
                            finalQuestionIds.push(p.QuestionID);
                            finalQuestionIds.push(...children.recordset.map(q => q.QuestionID));
                            orderingChildCount += children.recordset.length;
                        }
                    }
                } else {
                    // Các loại khác: lấy đúng số bài (passage) yêu cầu
                    const randomPassages = await sql.query`
                        SELECT TOP (${section.passageCount}) QuestionID FROM Questions 
                        WHERE QuestionType = ${section.type} AND IsPassage = 1 AND Level = ${level}
                        ORDER BY NEWID()`;

                    for (const p of randomPassages.recordset) {
                        finalQuestionIds.push(p.QuestionID);

                        const children = await sql.query`
                            SELECT QuestionID FROM Questions 
                            WHERE ParentID = ${p.QuestionID}
                            ORDER BY QuestionID ASC`;

                        finalQuestionIds.push(...children.recordset.map(q => q.QuestionID));
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

        // Đếm chỉ các câu hỏi con (không tính passage/đoạn văn)
        const countResult = await sql.query`
            SELECT COUNT(*) AS ChildCount FROM Exam_Questions eq
            JOIN Questions q ON eq.QuestionID = q.QuestionID
            WHERE eq.ExamID = ${examId} AND q.IsPassage = 0`;
        const childOnlyCount = countResult.recordset[0].ChildCount;

        res.status(201).json({
            message: 'Tạo đề thành công!',
            examId,
            totalInserted: childOnlyCount
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

        // lấy tất cả đáp án đúng của các câu hỏi thuộc đề thi này
        const correctAnswersResult = await sql.query`
            SELECT QuestionID, AnswerID 
            FROM Answers 
            WHERE IsCorrect = 1 AND QuestionID IN (
                SELECT QuestionID FROM Exam_Questions WHERE ExamID = ${parsedExamId}
            )`;

        // Chuyển đổi danh sách đáp án đúng  thành một đối tượng tra cứu nhanh (Key-Value)
        const correctMap = {};
        correctAnswersResult.recordset.forEach(row => {
            correctMap[row.QuestionID] = row.AnswerID;
        });

        // chấm điểm tự động
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
                displayOrder: ans.displayOrder || null  // Bao gồm displayOrder từ frontend
            });
        });

        const finalScore = totalQuestions > 0 ? Math.round(((correctCount * 10) / totalQuestions) * 100) / 100 : 0;

        // Tạo một bản ghi mới trong bảng ExamResults để lưu thông tin bài nộp
        const resultInsert = await sql.query`
            INSERT INTO ExamResults (ExamID, StudentID, Score, CompletedTime)
            OUTPUT INSERTED.ResultID
            VALUES (${parsedExamId}, ${parsedStudentId}, ${finalScore}, ${parsedCompletedTime})`;

        const resultId = resultInsert.recordset[0].ResultID;

        // Lưu chi tiết từng câu trả lời vào bảng ResultDetail
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

        // Lấy danh sách câu hỏi của đề thi theo thứ tự
        const questions = await sql.query`
            SELECT q.QuestionID, q.Content, q.IsPassage, q.ParentID, q.QuestionType, eq.QuestionOrder
            FROM Questions q
            JOIN Exam_Questions eq ON q.QuestionID = eq.QuestionID
            WHERE eq.ExamID = ${id}
            ORDER BY eq.QuestionOrder ASC`;

        // xáo trộn đáp án ngẫu nhiên
        const answers = await sql.query`
            SELECT AnswerID, QuestionID, AnswerContent 
            FROM Answers 
            WHERE QuestionID IN (SELECT QuestionID FROM Exam_Questions WHERE ExamID = ${id})
            ORDER BY NEWID()`;

        res.json({
            exam: examInfo.recordset[0],
            questions: questions.recordset.map(q => {
                // Parse content để tìm câu hỏi dạng passage (JSON)
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

        // Lấy lịch sử làm bài của sinh viên theo thứ tự giảm dần của thời gian làm bài
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
        // Lấy thông tin kết quả thi
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

        // Lấy tất cả các câu hỏi thi (bao gồm cả passage)
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

        // Lấy tất cả đáp án và lời giải thích cho các câu hỏi
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
                IsCorrect: ans.IsCorrect ? 1 : 0  // Chuyển giá trị boolean thành 1 hoặc 0
            }));
        }

        // Lấy những đáp án học sinh đã chọn (result_details)
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

        // Nhóm câu trả lời theo câu hỏi
        allAnswers.forEach(ans => {
            if (!answersByQuestion[ans.QuestionID]) {
                answersByQuestion[ans.QuestionID] = [];
            }
            answersByQuestion[ans.QuestionID].push(ans);
        });

        // Map result details bằng question
        resultDetails.recordset.forEach(rd => {
            resultDetailMap[rd.QuestionID] = rd;
        });

        // Cấu trúc câu hỏi với đầy đủ dữ liệu
        allQuestions.recordset.forEach(q => {
            questionMap[q.QuestionID] = {
                ...q,
                answers: answersByQuestion[q.QuestionID] || [],
                studentAnswer: resultDetailMap[q.QuestionID] || null
            };
        });

        // Sắp xếp các đoạn văn với các câu hỏi con
        allQuestions.recordset.forEach(q => {
            if (q.IsPassage) {
                groupedQuestions.push({
                    type: 'passage',
                    data: questionMap[q.QuestionID]
                });

                // Tìm câu hỏi con
                allQuestions.recordset.forEach(childQ => {
                    if (childQ.ParentID === q.QuestionID) {
                        groupedQuestions.push({
                            type: 'question',
                            data: questionMap[childQ.QuestionID]
                        });
                    }
                });
            } else if (!q.ParentID) {
                // Câu hỏi độc lập (không phải câu hỏi đoạn văn nếu có)
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
        //  xóa Exams 
        await sql.query`DELETE FROM Exams WHERE ExamID = ${id}`;
        res.json({ message: 'Xóa đề thi thành công' });
    } catch (err) {
        console.error('deleteExam error:', err);
        res.status(500).json({ message: 'Lỗi xóa đề thi', error: err.message });
    }
};

module.exports = { createExam, submitExam, getAllExams, getExamDetail, deleteExam, getStudentExamHistory, getExamResultDetail };
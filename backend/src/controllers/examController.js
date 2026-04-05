const sql = require('mssql');

// Tạo đề thi
const createExam = async (req, res) => {
    const { examName, duration, level, adminId, totalQuestions, selectedQuestionIds } = req.body;

    try {
        // 1. Tạo bản ghi Exam
        const examResult = await sql.query`
            INSERT INTO Exams (ExamName, Duration, TotalQuestions, CreatedBy, Level)
            OUTPUT INSERTED.ExamID
            VALUES (${examName}, ${duration || 50}, ${totalQuestions || 40}, ${adminId}, ${level})`;
        
        const examId = examResult.recordset[0].ExamID;
        let finalQuestionIds = [];

        if (selectedQuestionIds && selectedQuestionIds.length > 0) {
            // --- CHẾ ĐỘ TỰ CHỌN (MANUAL) ---
            const result = await sql.query`
                SELECT QuestionID FROM Questions 
                WHERE QuestionID IN (${selectedQuestionIds}) 
                OR ParentID IN (${selectedQuestionIds})
                ORDER BY IsPassage DESC, QuestionID ASC`;
            finalQuestionIds = result.recordset.map(q => q.QuestionID);
        } else {
            // --- CHẾ ĐỘ TỰ ĐỘNG (AUTO) THEO FORM 2025 ---
            const matrix = [
                { type: 'Leaflet', count: 2 },
                { type: 'Ordering', count: 1 },
                { type: 'Context_Filling', count: 1 },
                { type: 'Reading_8', count: 1 },
                { type: 'Reading_10', count: 1 }
            ];

            for (const item of matrix) {
                // Lưu ý: Nếu bạn muốn nhặt đủ 40 câu bất chấp mức độ Dễ/Khó, bạn có thể xóa đoạn "AND Level = ${level}" ở câu query dưới đi nhé.
                const randomPassages = await sql.query`
                    SELECT TOP (${item.count}) QuestionID FROM Questions 
                    WHERE QuestionType = ${item.type} AND IsPassage = 1 AND Level = ${level}
                    ORDER BY NEWID()`;

                if (randomPassages.recordset.length > 0) {
                    const passages = randomPassages.recordset;
                    
                    // SỬA Ở ĐÂY: Lặp qua từng đoạn văn độc lập để gom cụm (Đoạn văn + Câu hỏi con)
                    for (const p of passages) {
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

        // 2. Lưu vào bảng Exam_Questions
        if (finalQuestionIds.length > 0) {
            for (let i = 0; i < finalQuestionIds.length; i++) {
                await sql.query`
                    INSERT INTO Exam_Questions (ExamID, QuestionID, QuestionOrder, Point)
                    VALUES (${examId}, ${finalQuestionIds[i]}, ${i + 1}, 0.25)`;
            }
        }

        res.status(201).json({ 
            message: "Tạo đề thành công!", 
            examId, 
            totalInserted: finalQuestionIds.length 
        });

    } catch (err) {
        console.error("Lỗi chi tiết:", err);
        res.status(500).json({ message: "Lỗi tạo đề", error: err.message });
    }
};

// Nộp bài thi
const submitExam = async (req, res) => {
    const { examId, studentId, completedTime, userAnswers } = req.body; 

    try {
        // 1. Lấy danh sách đáp án ĐÚNG của các câu hỏi trong đề này
        const correctAnswersResult = await sql.query`
            SELECT QuestionID, AnswerID 
            FROM Answers 
            WHERE IsCorrect = 1 AND QuestionID IN (
                SELECT QuestionID FROM Exam_Questions WHERE ExamID = ${examId}
            )`;
        
        const correctMap = {};
        correctAnswersResult.recordset.forEach(row => {
            correctMap[row.QuestionID] = row.AnswerID;
        });

        // 2. Chấm điểm
        let correctCount = 0;
        const totalQuestions = Object.keys(correctMap).length;
        const details = [];

        userAnswers.forEach(ans => {
            const isCorrect = correctMap[ans.questionId] === ans.selectedAnswerId;
            if (isCorrect) correctCount++;
            
            details.push({
                questionId: ans.questionId,
                selectedAnswerId: ans.selectedAnswerId,
                isCorrect: isCorrect ? 1 : 0
            });
        });

        const finalScore = (correctCount * 10) / totalQuestions;

        // 3. Lưu vào bảng ExamResults
        const resultInsert = await sql.query`
            INSERT INTO ExamResults (ExamID, StudentID, Score, CompletedTime)
            OUTPUT INSERTED.ResultID
            VALUES (${examId}, ${studentId}, ${finalScore}, ${completedTime})`;
        
        const resultId = resultInsert.recordset[0].ResultID;

        // 4. Lưu chi tiết vào ResultDetail
        for (const detail of details) {
            await sql.query`
                INSERT INTO ResultDetail (ResultID, QuestionID, SelectedAnswerID, IsCorrect)
                VALUES (${resultId}, ${detail.questionId}, ${detail.selectedAnswerId}, ${detail.isCorrect})`;
        }

        res.status(200).json({
            message: "Nộp bài thành công!",
            score: finalScore.toFixed(2),
            correctCount,
            totalQuestions,
            resultId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi nộp bài", error: err.message });
    }
};

// Lấy danh sách đề thi (Cho màn hình chọn đề)
const getAllExams = async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Exams ORDER BY CreatedAt DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách đề", error: err.message });
    }
};

// Lấy chi tiết đề thi (Cho màn hình làm bài)
const getExamDetail = async (req, res) => {
    const { id } = req.params;
    try {
        // Lấy thông tin đề
        const examInfo = await sql.query`SELECT * FROM Exams WHERE ExamID = ${id}`;
        
        // Lấy danh sách câu hỏi (Kèm đoạn văn nếu có)
        const questions = await sql.query`
            SELECT q.QuestionID, q.Content, q.IsPassage, q.ParentID, q.QuestionType, eq.QuestionOrder
            FROM Questions q
            JOIN Exam_Questions eq ON q.QuestionID = eq.QuestionID
            WHERE eq.ExamID = ${id}
            ORDER BY eq.QuestionOrder ASC`;

        // Lấy danh sách đáp án cho các câu hỏi trên (ẨN CỘT IsCorrect)
        const answers = await sql.query`
            SELECT AnswerID, QuestionID, AnswerContent 
            FROM Answers 
            WHERE QuestionID IN (SELECT QuestionID FROM Exam_Questions WHERE ExamID = ${id})
            ORDER BY NEWID()`;

        res.json({
            exam: examInfo.recordset[0],
            questions: questions.recordset,
            answers: answers.recordset
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy chi tiết đề", error: err.message });
    }
};

module.exports = { createExam, submitExam, getAllExams, getExamDetail };
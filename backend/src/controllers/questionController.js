const sql = require('mssql');

const createQuestion = async (req, res) => {
    const { content, level, tagIds, isPassage, parentId, answers, questionType } = req.body;
    
    try {
        // 1. Lưu nội dung câu hỏi (hoặc đoạn văn) vào bảng Questions
        const result = await sql.query`
            INSERT INTO Questions (Content, Level, IsPassage, ParentID, QuestionType) 
            OUTPUT INSERTED.QuestionID
            VALUES (${content}, ${level}, ${isPassage || 0}, ${parentId || null}, ${questionType || null})`;
        
        const newQuestionId = result.recordset[0].QuestionID;

        // 2. Nếu có Tags đi kèm, lưu vào bảng trung gian Question_Tags
        if (tagIds && tagIds.length > 0) {
            for (const tagId of tagIds) {
                await sql.query`INSERT INTO Question_Tags (QuestionID, TagID) VALUES (${newQuestionId}, ${tagId})`;
            }
        }

        // 3. Nếu có danh sách đáp án (dành cho câu lẻ hoặc câu con của bài đọc)
        if (answers && answers.length > 0) {
            for (const ans of answers) {
                await sql.query`
                    INSERT INTO Answers (QuestionID, AnswerContent, IsCorrect, Explanation)
                    VALUES (${newQuestionId}, ${ans.content}, ${ans.isCorrect ? 1 : 0}, ${ans.explanation})`;
            }
        }

        res.status(201).json({ message: "Thành công!", questionId: newQuestionId });
    } catch (err) {
        res.status(500).json({ message: "Lỗi Server", error: err.message });
    }
};

const getAllQuestions = async (req, res) => {
    try {
        // 1. Lấy giá trị lọc từ URL (ví dụ: /api/questions?type=Leaflet)
        const { type } = req.query; 

        // 2. Xây dựng câu lệnh SQL linh hoạt
        let queryStr = `
            SELECT q.*, 
                (SELECT t.TagName FROM Tags t 
                 JOIN Question_Tags qt ON t.TagID = qt.TagID 
                 WHERE qt.QuestionID = q.QuestionID FOR JSON PATH) AS Tags
            FROM Questions q`;

        // 3. Khởi tạo Request để có thể thêm Parameter an toàn (chống SQL Injection)
        const request = new sql.Request();

        // 4. Nếu có truyền type lên thì thêm điều kiện WHERE
        if (type) {
            queryStr += ` WHERE q.QuestionType = @typeParam`;
            request.input('typeParam', sql.NVarChar, type); // Truyền tham số an toàn
        }

        queryStr += ` ORDER BY q.CreatedAt DESC`;

        // 5. Thực thi truy vấn
        const result = await request.query(queryStr);

        const data = result.recordset.map(item => ({
            ...item,
            Tags: item.Tags ? JSON.parse(item.Tags) : []
        }));

        res.json(data);
    } catch (err) {
        // In ra console để dễ debug nếu có lỗi SQL
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy danh sách", error: err.message });
    }
};

module.exports = { createQuestion, getAllQuestions };
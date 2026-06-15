const sql = require('mssql');

// ====================================================================
// 1. LẤY TẤT CẢ RESOURCES
// ====================================================================
const getAllResources = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT r.ResourceID, r.Title, r.Type, r.ContentURL, 
                   r.TagID, t.TagName, r.CreatedAt
            FROM Resources r
            JOIN Tags t ON r.TagID = t.TagID
            ORDER BY t.TagName`;
        res.json(result.recordset);
    } catch (err) {
        console.error('getAllResources error:', err);
        res.status(500).json({ message: 'Lỗi lấy danh sách tài liệu', error: err.message });
    }
};

// ====================================================================
// 2. LẤY RESOURCE THEO TAG ID
// ====================================================================
const getResourcesByTagId = async (req, res) => {
    const { tagId } = req.params;
    const parsedTagId = parseInt(tagId);

    if (!parsedTagId || isNaN(parsedTagId)) {
        return res.status(400).json({ message: 'Cần cung cấp tagId hợp lệ' });
    }

    try {
        const result = await sql.query`
            SELECT r.ResourceID, r.Title, r.Type, r.ContentURL, 
                   r.TagID, t.TagName, r.CreatedAt
            FROM Resources r
            JOIN Tags t ON r.TagID = t.TagID
            WHERE r.TagID = ${parsedTagId}`;
        res.json(result.recordset);
    } catch (err) {
        console.error('getResourcesByTagId error:', err);
        res.status(500).json({ message: 'Lỗi lấy tài liệu theo tag', error: err.message });
    }
};

// ====================================================================
// 3. GỢI Ý TÀI LIỆU CHO HỌC SINH (DỰA TRÊN TAG SAI NHIỀU NHẤT)
// ====================================================================
const getRecommendedResources = async (req, res) => {
    const { studentId, limit = 10 } = req.query;
    const parsedStudentId = parseInt(studentId);
    const parsedLimit = parseInt(limit);

    if (!parsedStudentId || isNaN(parsedStudentId)) {
        return res.status(400).json({ message: 'Cần cung cấp studentId hợp lệ' });
    }

    try {
        const request = new sql.Request();
        request.input('StudentID', sql.Int, parsedStudentId);
        request.input('Limit', sql.Int, parsedLimit);

        // Query: Tính tỷ lệ sai theo tag cho học sinh → JOIN với Resources
        const result = await request.query`
            SELECT 
                t.TagID,
                t.TagName,
                r.ResourceID,
                r.Title AS DocumentTitle,
                r.ContentURL AS DocumentURL,
                r.Type AS DocumentType,
                COUNT(*) AS TotalQuestions,
                SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) AS TotalWrong,
                CAST(
                    ROUND(
                        SUM(CASE WHEN rd.IsCorrect = 0 THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*), 
                        1
                    ) AS DECIMAL(5,1)
                ) AS ErrorRate
            FROM ResultDetail rd
            JOIN ExamResults er ON rd.ResultID = er.ResultID
            JOIN Question_Tags qt ON rd.QuestionID = qt.QuestionID
            JOIN Tags t ON qt.TagID = t.TagID
            LEFT JOIN Resources r ON t.TagID = r.TagID
            WHERE er.StudentID = @StudentID
            GROUP BY t.TagID, t.TagName, r.ResourceID, r.Title, r.ContentURL, r.Type
            HAVING SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) > 0
            ORDER BY ErrorRate DESC
            OFFSET 0 ROWS FETCH NEXT @Limit ROWS ONLY`;

        // Thêm trường priority dựa trên ErrorRate
        const recommendations = result.recordset.map(row => {
            let priority = 'low';
            let priorityLabel = '🟢 Khá tốt';
            if (row.ErrorRate > 60) {
                priority = 'high';
                priorityLabel = '🔴 Cần ôn ngay';
            } else if (row.ErrorRate > 30) {
                priority = 'medium';
                priorityLabel = '🟡 Nên ôn tập';
            }

            return {
                tagId: row.TagID,
                tagName: row.TagName,
                resourceId: row.ResourceID,
                documentTitle: row.DocumentTitle,
                documentUrl: row.DocumentURL,
                documentType: row.DocumentType,
                totalQuestions: row.TotalQuestions,
                totalWrong: row.TotalWrong,
                errorRate: row.ErrorRate,
                priority,
                priorityLabel
            };
        });

        res.json(recommendations);
    } catch (err) {
        console.error('getRecommendedResources error:', err);
        res.status(500).json({ message: 'Lỗi lấy tài liệu gợi ý', error: err.message });
    }
};

module.exports = {
    getAllResources,
    getResourcesByTagId,
    getRecommendedResources
};

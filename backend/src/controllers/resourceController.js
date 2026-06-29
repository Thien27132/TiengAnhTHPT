const sql = require('mssql');
const path = require('path');
const fs = require('fs');

// Đường dẫn thư mục lưu PDF
const DOCUMENTS_DIR = path.join(__dirname, '../../public/documents');

// 1. LẤY TẤT CẢ RESOURCES (hỗ trợ search)
const getAllResources = async (req, res) => {
    const { search } = req.query;
    try {
        // truy vấn tìm kiếm bằng từ khóa chứa trong tiêu đề tài liệu
        // Nếu không có từ khóa tìm kiếm, lấy toàn bộ danh sách tài liệu sắp xếp theo ngày đăng mới nhất
        let result;
        if (search && search.trim()) {
            const searchPattern = `%${search.trim()}%`;
            result = await sql.query`
                SELECT r.ResourceID, r.Title, r.Type, r.ContentURL, 
                       r.TagID, t.TagName, r.CreatedAt
                FROM Resources r
                JOIN Tags t ON r.TagID = t.TagID
                WHERE r.Title LIKE ${searchPattern} OR t.TagName LIKE ${searchPattern}
                ORDER BY r.CreatedAt DESC`;
        } else {
            result = await sql.query`
                SELECT r.ResourceID, r.Title, r.Type, r.ContentURL, 
                       r.TagID, t.TagName, r.CreatedAt
                FROM Resources r
                JOIN Tags t ON r.TagID = t.TagID
                ORDER BY r.CreatedAt DESC`;
        }
        res.json(result.recordset);
    } catch (err) {
        console.error('getAllResources error:', err);
        res.status(500).json({ message: 'Lỗi lấy danh sách tài liệu', error: err.message });
    }
};

// 2. LẤY RESOURCE THEO TAG ID
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

// 3. GỢI Ý TÀI LIỆU CHO HỌC SINH (DỰA TRÊN TAG SAI NHIỀU NHẤT)
const getRecommendedResources = async (req, res) => {
    const { studentId, limit = 10 } = req.query;
    const parsedStudentId = parseInt(studentId);
    const parsedLimit = parseInt(limit);

    // Nhận studentId từ query của request
    if (!parsedStudentId || isNaN(parsedStudentId)) {
        return res.status(400).json({ message: 'Cần cung cấp studentId hợp lệ' });
    }

    try {
        const request = new sql.Request();
        request.input('StudentID', sql.Int, parsedStudentId);
        request.input('Limit', sql.Int, parsedLimit);

        // kết hợp nhiều bảng: chi tiết bài làm, bài thi của đúng học sinh, bảng tag, bảng tài liệu 
        // truy vấn để tính toán số câu trả lời đúng sai trên từng tag, theo từng học sinh
        // nhóm dữ liệu theo từng thẻ kiến thức (GROUP BY t.TagID, t.TagName)
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

// 4. THÊM TÀI LIỆU MỚI (upload file PDF)
const createResource = async (req, res) => {
    const { title, tagId } = req.body;
    const file = req.file;

    if (!title || !tagId || !file) {
        // Xóa file đã upload nếu thiếu thông tin
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({ message: 'Cần cung cấp tiêu đề, tag và file PDF' });
    }

    const parsedTagId = parseInt(tagId);
    if (isNaN(parsedTagId)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ message: 'TagID không hợp lệ' });
    }

    try {
        // Lấy UploadedBy từ token (hoặc mặc định AdminID = 1)
        const uploadedBy = req.user?.UserID || 1;
        const contentURL = `/documents/${file.filename}`;

        const request = new sql.Request();
        request.input('Title', sql.NVarChar(200), title);
        request.input('Type', sql.NVarChar(50), 'pdf');
        request.input('ContentURL', sql.NVarChar(sql.MAX), contentURL);
        request.input('TagID', sql.Int, parsedTagId);
        request.input('UploadedBy', sql.Int, uploadedBy);

        const result = await request.query`
            INSERT INTO Resources (Title, Type, ContentURL, TagID, UploadedBy, CreatedAt)
            OUTPUT INSERTED.ResourceID
            VALUES (@Title, @Type, @ContentURL, @TagID, @UploadedBy, GETDATE())`;

        const newId = result.recordset[0].ResourceID;
        console.log(`✅ Tạo tài liệu mới: [${newId}] ${title}`);

        res.status(201).json({
            message: 'Thêm tài liệu thành công',
            resourceId: newId,
            contentURL
        });
    } catch (err) {
        // Xóa file nếu insert thất bại
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        console.error('createResource error:', err);
        res.status(500).json({ message: 'Lỗi thêm tài liệu', error: err.message });
    }
};

// 5. XÓA TÀI LIỆU
const deleteResource = async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id);

    if (!parsedId || isNaN(parsedId)) {
        return res.status(400).json({ message: 'ResourceID không hợp lệ' });
    }

    try {
        // Lấy ContentURL để xóa file vật lý
        const resource = await sql.query`
            SELECT ContentURL FROM Resources WHERE ResourceID = ${parsedId}`;

        if (!resource.recordset || resource.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
        }

        const contentURL = resource.recordset[0].ContentURL;

        // Xóa record trong database
        await sql.query`DELETE FROM Resources WHERE ResourceID = ${parsedId}`;

        // Xóa file vật lý (nếu tồn tại)
        if (contentURL) {
            const filename = path.basename(contentURL);
            const filePath = path.join(DOCUMENTS_DIR, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Đã xóa file: ${filePath}`);
            }
        }

        console.log(`✅ Đã xóa tài liệu ID: ${parsedId}`);
        res.json({ message: 'Xóa tài liệu thành công' });
    } catch (err) {
        console.error('deleteResource error:', err);
        res.status(500).json({ message: 'Lỗi xóa tài liệu', error: err.message });
    }
};

module.exports = {
    getAllResources,
    getResourcesByTagId,
    getRecommendedResources,
    createResource,
    deleteResource
};

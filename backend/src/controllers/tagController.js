const sql = require('mssql');

// Lấy tất cả Tags kèm tên Skill
const getAllTags = async (req, res) => {
    try {
        const result = await sql.query`
            SELECT t.TagID, t.TagName, s.SkillName 
            FROM Tags t 
            JOIN Skills s ON t.SkillID = s.SkillID`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách Tag", error: err.message });
    }
};

// Thêm Tag mới
const createTag = async (req, res) => {
    const { tagName, skillId } = req.body;
    try {
        await sql.query`
            INSERT INTO Tags (TagName, SkillID) 
            VALUES (${tagName}, ${skillId})`;
        res.status(201).json({ message: "Thêm Tag thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi thêm Tag", error: err.message });
    }
};

module.exports = { getAllTags, createTag };
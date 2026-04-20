const sql = require('mssql');

// ====================================================================
// 1. TỶ LỆ SAI THEO TAG (Toàn hệ thống)
// ====================================================================
const getErrorRateByTagSystem = async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.execute('sp_GetErrorRateByTagSystem');
        res.json(result.recordset);
    } catch (err) {
        console.error('getErrorRateByTagSystem error:', err);
        res.status(500).json({ message: 'Lỗi lấy tỷ lệ sai theo tag', error: err.message });
    }
};

// ====================================================================
// 2. TỶ LỀ SAI THEO TAG - CHI TIẾT (Từng học sinh hoặc tất cả)
// ====================================================================
const getErrorRateByTagStudent = async (req, res) => {
    const { studentId } = req.query;

    try {
        const request = new sql.Request();
        if (studentId) {
            request.input('StudentID', sql.Int, studentId);
        } else {
            request.input('StudentID', sql.Int, null);
        }

        const result = await request.execute('sp_GetErrorRateByTagStudent');
        res.json(result.recordset);
    } catch (err) {
        console.error('getErrorRateByTagStudent error:', err);
        res.status(500).json({ message: 'Lỗi lấy tỷ lệ sai chi tiết', error: err.message });
    }
};

// ====================================================================
// 3. SO SÁNH TỶ LỆ SAI VỚI TRUNG BÌNH
// ====================================================================
const compareErrorRateWithAverage = async (req, res) => {
    const { tagId } = req.query;

    try {
        const request = new sql.Request();
        request.input('TagID', sql.Int, tagId || null);

        const result = await request.execute('sp_CompareErrorRateWithAverage');
        
        // Nhóm kết quả theo tag
        const groupedByTag = {};
        result.recordset.forEach(row => {
            if (!groupedByTag[row.TagID]) {
                groupedByTag[row.TagID] = {
                    tagName: row.TagName,
                    students: []
                };
            }
            groupedByTag[row.TagID].students.push(row);
        });

        res.json(groupedByTag);
    } catch (err) {
        console.error('compareErrorRateWithAverage error:', err);
        res.status(500).json({ message: 'Lỗi so sánh tỷ lệ sai', error: err.message });
    }
};

// ====================================================================
// 4. XẾP HẠNG HỌC SINH THEO TAG
// ====================================================================
const rankStudentsByTag = async (req, res) => {
    const { tagId } = req.query;

    try {
        const request = new sql.Request();
        request.input('TagID', sql.Int, tagId || null);

        const result = await request.execute('sp_RankStudentsByTag');
        
        // Nhóm theo tag
        const rankedByTag = {};
        result.recordset.forEach(row => {
            if (!rankedByTag[row.TagID]) {
                rankedByTag[row.TagID] = {
                    tagName: row.TagName,
                    rankings: []
                };
            }
            rankedByTag[row.TagID].rankings.push(row);
        });

        res.json(rankedByTag);
    } catch (err) {
        console.error('rankStudentsByTag error:', err);
        res.status(500).json({ message: 'Lỗi xếp hạng học sinh', error: err.message });
    }
};

// ====================================================================
// 5. PHÂN BỐ HỌC SINH THEO MỨC ĐỘ
// ====================================================================
const getStudentDistributionByErrorRate = async (req, res) => {
    const { tagId } = req.query;

    try {
        const request = new sql.Request();
        request.input('TagID', sql.Int, tagId || null);

        const result = await request.execute('sp_StudentDistributionByErrorRate');
        
        // Nhóm theo tag
        const distributionByTag = {};
        result.recordset.forEach(row => {
            if (!distributionByTag[row.TagID]) {
                distributionByTag[row.TagID] = {
                    tagName: row.TagName,
                    distribution: []
                };
            }
            distributionByTag[row.TagID].distribution.push({
                errorGroup: row.ErrorGroup,
                studentCount: row.StudentCount,
                percentage: row.Percentage
            });
        });

        res.json(distributionByTag);
    } catch (err) {
        console.error('getStudentDistributionByErrorRate error:', err);
        res.status(500).json({ message: 'Lỗi lấy phân bố học sinh', error: err.message });
    }
};

// ====================================================================
// 6. DANH SÁCH HỌC SINH CẦN FOCUS (TOP & WEAK)
// ====================================================================
const getStudentsFocusList = async (req, res) => {
    const { tagId, topCount = 5 } = req.query;

    try {
        const request = new sql.Request();
        request.input('TagID', sql.Int, tagId || null);
        request.input('TopCount', sql.Int, parseInt(topCount));

        const result = await request.execute('sp_GetStudentsFocusList');
        
        // Nhóm theo tag và status
        const focusList = {};
        result.recordset.forEach(row => {
            if (!focusList[row.TagID]) {
                focusList[row.TagID] = {
                    tagName: row.TagName,
                    excellent: [],
                    needSupport: []
                };
            }
            
            if (row.Status === '⭐ Xuất sắc') {
                focusList[row.TagID].excellent.push(row);
            } else if (row.Status === '🔴 Cần hỗ trợ') {
                focusList[row.TagID].needSupport.push(row);
            }
        });

        res.json(focusList);
    } catch (err) {
        console.error('getStudentsFocusList error:', err);
        res.status(500).json({ message: 'Lỗi lấy danh sách học sinh cần focus', error: err.message });
    }
};

module.exports = {
    getErrorRateByTagSystem,
    getErrorRateByTagStudent,
    compareErrorRateWithAverage,
    rankStudentsByTag,
    getStudentDistributionByErrorRate,
    getStudentsFocusList
};

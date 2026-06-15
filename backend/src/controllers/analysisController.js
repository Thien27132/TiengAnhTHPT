const sql = require('mssql');


// 1. TỶ LỆ SAI THEO TAG (Toàn hệ thống)

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


// 2. TỶ LỀ SAI THEO TAG - CHI TIẾT (Từng học sinh hoặc tất cả)

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


// 3. SO SÁNH TỶ LỆ SAI VỚI TRUNG BÌNH

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


// 4. XẾP HẠNG HỌC SINH THEO TAG

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


// 5. PHÂN BỐ HỌC SINH THEO MỨC ĐỘ

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

// ====================================================================
// 7. DANH SÁCH CHI TIẾT CÂU TRẢ LỜI SAI KÈM TAG
// ====================================================================
const getIncorrectAnswersWithTags = async (req, res) => {
    const { resultId } = req.query;
    const parsedResultId = parseInt(resultId);

    if (!parsedResultId || isNaN(parsedResultId)) {
        return res.status(400).json({ message: 'Cần cung cấp resultId hợp lệ' });
    }

    try {
        // Lấy thông tin bài thi
        const examResultInfo = await sql.query`
            SELECT 
                er.ResultID,
                er.ExamID,
                er.StudentID,
                er.Score,
                er.CompletedTime,
                er.CompletedAt,
                e.ExamName,
                e.Level,
                u.FullName
            FROM ExamResults er
            JOIN Exams e ON er.ExamID = e.ExamID
            JOIN Users u ON er.StudentID = u.UserID
            WHERE er.ResultID = ${parsedResultId}`;

        if (!examResultInfo.recordset || examResultInfo.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy kết quả thi', resultId: parsedResultId });
        }

        const examInfo = examResultInfo.recordset[0];
        console.log('✅ Found exam result:', examInfo);

        // Lấy danh sách câu trả lời sai (không dùng STRING_AGG để tránh lỗi)
        const incorrectAnswers = await sql.query`
            SELECT 
                rd.DetailID,
                rd.QuestionID,
                rd.DisplayOrder,
                q.Content AS QuestionContent,
                q.QuestionType,
                rd.SelectedAnswerID,
                a_selected.AnswerContent AS StudentAnswer,
                a_correct.AnswerID AS CorrectAnswerID,
                a_correct.AnswerContent AS CorrectAnswer,
                a_correct.Explanation AS Explanation,
                t.TagID,
                t.TagName,
                r.ContentURL AS DocumentURL,
                r.Title AS DocumentTitle
            FROM ResultDetail rd
            INNER JOIN Questions q ON rd.QuestionID = q.QuestionID
            LEFT JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
            LEFT JOIN Tags t ON qt.TagID = t.TagID
            LEFT JOIN Resources r ON t.TagID = r.TagID
            LEFT JOIN Answers a_selected ON rd.SelectedAnswerID = a_selected.AnswerID
            LEFT JOIN Answers a_correct ON q.QuestionID = a_correct.QuestionID AND a_correct.IsCorrect = 1
            WHERE rd.ResultID = ${parsedResultId} AND rd.IsCorrect = 0
            ORDER BY rd.DisplayOrder ASC, t.TagID ASC`;

        console.log('✅ Found incorrect answers:', incorrectAnswers.recordset.length);

        // Xử lý dữ liệu - Nhóm Tag cho mỗi câu
        const allIncorrectAnswers = [];
        const groupedByTag = {};
        const processedQuestions = {};

        if (incorrectAnswers.recordset && incorrectAnswers.recordset.length > 0) {
            incorrectAnswers.recordset.forEach(row => {
                // Tạo key cho câu hỏi
                const questionKey = row.QuestionID;

                // Nếu chưa xử lý câu này, tạo object mới
                if (!processedQuestions[questionKey]) {
                    processedQuestions[questionKey] = {
                        detailId: row.DetailID,
                        questionId: row.QuestionID,
                        displayOrder: row.DisplayOrder,
                        questionContent: row.QuestionContent,
                        questionType: row.QuestionType,
                        tags: [],
                        studentAnswerId: row.SelectedAnswerID,
                        studentAnswer: row.StudentAnswer || 'Không chọn',
                        correctAnswerId: row.CorrectAnswerID,
                        correctAnswer: row.CorrectAnswer || 'Không có đáp án',
                        explanation: row.Explanation || 'Không có giải thích'
                    };
                }

                // Thêm tag nếu tồn tại (giờ bao gồm cả documentUrl)
                if (row.TagName && row.TagName.trim()) {
                    if (!processedQuestions[questionKey].tags.find(t => t.name === row.TagName)) {
                        processedQuestions[questionKey].tags.push({
                            name: row.TagName,
                            documentUrl: row.DocumentURL || null,
                            documentTitle: row.DocumentTitle || null
                        });
                    }
                }
            });

            // Chuyển sang array
            Object.values(processedQuestions).forEach(item => {
                allIncorrectAnswers.push(item);

                // Nhóm theo tag
                item.tags.forEach(tag => {
                    const tagName = tag.name;
                    if (!groupedByTag[tagName]) {
                        groupedByTag[tagName] = {
                            questions: [],
                            documentUrl: tag.documentUrl,
                            documentTitle: tag.documentTitle
                        };
                    }
                    if (!groupedByTag[tagName].questions.find(q => q.questionId === item.questionId)) {
                        groupedByTag[tagName].questions.push(item);
                    }
                });
            });
        }

        console.log('✅ Processed answers:', allIncorrectAnswers.length, 'questions');
        console.log('✅ Tags:', Object.keys(groupedByTag));

        res.json({
            examInfo: {
                resultId: examInfo.ResultID,
                examId: examInfo.ExamID,
                examName: examInfo.ExamName,
                level: examInfo.Level,
                studentId: examInfo.StudentID,
                studentName: examInfo.FullName,
                score: examInfo.Score,
                completedTime: examInfo.CompletedTime,
                completedAt: examInfo.CompletedAt,
                totalIncorrectAnswers: allIncorrectAnswers.length
            },
            incorrectAnswers: allIncorrectAnswers,
            groupedByTag: groupedByTag,
            debug: {
                totalRecords: incorrectAnswers.recordset.length,
                totalUniqueQuestions: allIncorrectAnswers.length
            }
        });
    } catch (err) {
        console.error('❌ getIncorrectAnswersWithTags error:', err);
        res.status(500).json({ 
            message: 'Lỗi lấy danh sách câu trả lời sai', 
            error: err.message,
            details: err.originalError ? err.originalError.message : null
        });
    }
};


const getStudentSkillMap = async (req, res) => {
    const { studentId, limit = 10 } = req.query;
    const parsedStudentId = parseInt(studentId);
    const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;

    if (!parsedStudentId || isNaN(parsedStudentId)) {
        return res.status(400).json({ message: 'Cần cung cấp studentId hợp lệ' });
    }

    // Bộ từ điển ánh xạ Tag -> Skill
    const skillDictionary = {
        'Ngữ pháp': ['Mệnh đề quan hệ', 'Thì hiện tại hoàn thành', 'Đại từ', 'Liên từ', 'Giới từ', 'Lượng từ'],
        'Từ vựng': ['Động từ', 'Danh từ', 'Tính từ', 'Tìm từ đồng nghĩa (Synonym)', 'Trái nghĩa (Opposite questions)', 'Cụm từ cố định (Collocations)', 'Phrasal Verbs'],
        'Đọc hiểu': ['Đọc điền từ (Cloze test)', 'Câu hỏi chi tiết (Detail)', 'Reference (Câu hỏi quy chiếu)', 'Suy luận (Inference)']
    };

    // Hàm phụ trợ tìm nhóm kỹ năng dựa vào tên Tag
    const getSkillCategory = (tagName) => {
        for (const [skill, tags] of Object.entries(skillDictionary)) {
            // Dùng includes để map tương đối, tránh lỗi gõ sai chữ hoa/thường
            if (tags.some(t => tagName.includes(t) || t.includes(tagName))) {
                return skill;
            }
        }
        return 'Khác'; // Fallback nếu có tag lạ
    };

    try {
        const request = new sql.Request();
        request.input('StudentID', sql.Int, parsedStudentId);
        request.input('Limit', sql.Int, parsedLimit);

        const result = await request.query`
            SELECT
                t.TagName,
                COUNT(*) AS TotalQuestions,
                SUM(CASE WHEN rd.IsCorrect = 1 THEN 1 ELSE 0 END) AS CorrectQuestions
            FROM ResultDetail rd
            JOIN ExamResults er ON rd.ResultID = er.ResultID
            JOIN Question_Tags qt ON rd.QuestionID = qt.QuestionID
            JOIN Tags t ON qt.TagID = t.TagID
            WHERE er.StudentID = @StudentID
              AND er.ResultID IN (
                SELECT TOP (@Limit) ResultID
                FROM ExamResults
                WHERE StudentID = @StudentID
                ORDER BY CompletedAt DESC
              )
            GROUP BY t.TagName`;

        // Khởi tạo bộ chứa 3 kỹ năng
        const skillBuckets = {
            'Ngữ pháp': { total: 0, correct: 0 },
            'Từ vựng': { total: 0, correct: 0 },
            'Đọc hiểu': { total: 0, correct: 0 }
        };

        // Phân loại và cộng dồn số câu hỏi
        result.recordset.forEach(row => {
            const category = getSkillCategory(row.TagName);
            if (skillBuckets[category]) {
                skillBuckets[category].total += row.TotalQuestions;
                skillBuckets[category].correct += row.CorrectQuestions;
            }
        });

        // Tính tỷ lệ % cho từng nhóm để ném ra Front-end vẽ Radar Chart
        const chartData = {
            labels: ['Ngữ pháp', 'Từ vựng', 'Đọc hiểu'],
            data: [
                skillBuckets['Ngữ pháp'].total ? Math.round((skillBuckets['Ngữ pháp'].correct * 100) / skillBuckets['Ngữ pháp'].total) : 0,
                skillBuckets['Từ vựng'].total ? Math.round((skillBuckets['Từ vựng'].correct * 100) / skillBuckets['Từ vựng'].total) : 0,
                skillBuckets['Đọc hiểu'].total ? Math.round((skillBuckets['Đọc hiểu'].correct * 100) / skillBuckets['Đọc hiểu'].total) : 0
            ]
        };

        res.json(chartData);
    } catch (err) {
        console.error('getStudentSkillMap error:', err);
        res.status(500).json({ message: 'Lỗi lấy bản đồ năng lực học sinh', error: err.message });
    }
};

const getStudentProgress = async (req, res) => {
    const { studentId, limit = 7 } = req.query; // Mặc định lấy 7 đề gần nhất như giao diện
    const parsedStudentId = parseInt(studentId);
    const parsedLimit = parseInt(limit);

    if (!parsedStudentId || isNaN(parsedStudentId)) {
        return res.status(400).json({ message: 'Cần cung cấp studentId hợp lệ' });
    }

    try {
        const request = new sql.Request();
        request.input('StudentID', sql.Int, parsedStudentId);
        request.input('Limit', sql.Int, parsedLimit);

        // Lấy danh sách điểm số, sắp xếp ASC (tăng dần theo thời gian) để vẽ đồ thị từ trái sang phải
        const result = await request.query`
            SELECT TOP (@Limit)
                e.ExamName,
                er.Score,
                er.CompletedAt
            FROM ExamResults er
            JOIN Exams e ON er.ExamID = e.ExamID
            WHERE er.StudentID = @StudentID
            ORDER BY er.CompletedAt DESC
        `;

        // Đảo ngược mảng để đề thi cũ nhất nằm bên trái, mới nhất bên phải của Line Chart
        const chronologicalData = result.recordset.reverse();

        // Format lại dữ liệu cho Front-end (Chart.js / Recharts dễ đọc)
        const chartData = {
            labels: chronologicalData.map(row => row.ExamName), // Trục X: Tên đề thi
            scores: chronologicalData.map(row => row.Score)     // Trục Y: Điểm số
        };

        res.json(chartData);
    } catch (err) {
        console.error('getStudentProgress error:', err);
        res.status(500).json({ message: 'Lỗi lấy tiến độ học tập', error: err.message });
    }
};

module.exports = {
    getErrorRateByTagSystem,
    getErrorRateByTagStudent,
    compareErrorRateWithAverage,
    getStudentProgress,
    rankStudentsByTag,
    getStudentDistributionByErrorRate,
    getStudentsFocusList,
    getIncorrectAnswersWithTags,
    getStudentSkillMap
};

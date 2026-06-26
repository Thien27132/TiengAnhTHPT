const sql = require('mssql');


// 1. DANH SÁCH CHI TIẾT CÂU TRẢ LỜI SAI KÈM TAG
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

        // Tính displayOrder đúng cho tất cả câu hỏi (không đếm passage)
        const allNonPassageQuestions = await sql.query`
            SELECT eq.QuestionID, eq.QuestionOrder
            FROM Exam_Questions eq
            INNER JOIN Questions q ON eq.QuestionID = q.QuestionID
            WHERE eq.ExamID = ${examInfo.ExamID} AND q.IsPassage = 0
            ORDER BY eq.QuestionOrder ASC`;

        const displayOrderMap = {};
        allNonPassageQuestions.recordset.forEach((q, idx) => {
            displayOrderMap[q.QuestionID] = idx + 1; // 1-based: 1, 2, 3, ..., 40
        });

        // Lấy danh sách câu trả lời sai VÀ chưa chọn
        // Dùng Exam_Questions làm bảng gốc, LEFT JOIN ResultDetail để bắt cả câu chưa trả lời
        const incorrectAnswers = await sql.query`
            SELECT 
                rd.DetailID,
                eq.QuestionID,
                rd.DisplayOrder,
                eq.QuestionOrder,
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
            FROM Exam_Questions eq                                   
            INNER JOIN Questions q ON eq.QuestionID = q.QuestionID   
            LEFT JOIN ResultDetail rd ON rd.QuestionID = eq.QuestionID AND rd.ResultID = ${parsedResultId}
            LEFT JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
            LEFT JOIN Tags t ON qt.TagID = t.TagID
            LEFT JOIN Resources r ON t.TagID = r.TagID                                         
            LEFT JOIN Answers a_selected ON rd.SelectedAnswerID = a_selected.AnswerID
            LEFT JOIN Answers a_correct ON q.QuestionID = a_correct.QuestionID AND a_correct.IsCorrect = 1
            WHERE eq.ExamID = ${examInfo.ExamID}
              AND q.IsPassage = 0                                       
              AND (rd.DetailID IS NULL OR rd.IsCorrect = 0)               
            ORDER BY eq.QuestionOrder ASC, t.TagID ASC`;

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
                    const isUnanswered = row.SelectedAnswerID == null;
                    // Dùng rd.DisplayOrder nếu có, không thì dùng displayOrderMap (chỉ đếm câu hỏi, bỏ passage)
                    const correctDisplayOrder = row.DisplayOrder || displayOrderMap[row.QuestionID] || 0;
                    processedQuestions[questionKey] = {
                        detailId: row.DetailID,
                        questionId: row.QuestionID,
                        displayOrder: correctDisplayOrder,
                        questionContent: row.QuestionContent,
                        questionType: row.QuestionType,
                        tags: [],
                        studentAnswerId: row.SelectedAnswerID,
                        studentAnswer: isUnanswered ? 'Chưa chọn' : (row.StudentAnswer || 'Không chọn'),
                        correctAnswerId: row.CorrectAnswerID,
                        correctAnswer: row.CorrectAnswer || 'Không có đáp án',
                        explanation: row.Explanation || 'Không có giải thích',
                        isUnanswered: isUnanswered
                    };
                }

                // Thêm tag nếu tồn tại bao gồm cả documentUrl
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

            // Chuyển sang array VÀ sắp xếp theo displayOrder tăng dần
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

            // Sắp xếp danh sách theo displayOrder tăng dần
            allIncorrectAnswers.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

            // Sắp xếp câu hỏi trong từng tag theo displayOrder tăng dần
            Object.values(groupedByTag).forEach(tagData => {
                tagData.questions.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            });
        }

        console.log('✅ Processed answers:', allIncorrectAnswers.length, 'questions');
        console.log('✅ Tags:', Object.keys(groupedByTag));

        const totalUnanswered = allIncorrectAnswers.filter(q => q.isUnanswered).length;
        const totalWrong = allIncorrectAnswers.length - totalUnanswered;

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
                totalIncorrectAnswers: allIncorrectAnswers.length,
                totalWrong: totalWrong,
                totalUnanswered: totalUnanswered
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

    // Bộ từ điển ánh xạ Tag -> Skill (khớp với SQL seed: @NguPhap, @TuVung, @DocHieu)
    const skillDictionary = {
        'Ngữ pháp': [
            // 12 Thì
            'Thì hiện tại đơn', 'Thì hiện tại tiếp diễn', 'Thì hiện tại hoàn thành', 'Thì hiện tại hoàn thành tiếp diễn',
            'Thì quá khứ đơn', 'Thì quá khứ tiếp diễn', 'Thì quá khứ hoàn thành', 'Thì quá khứ hoàn thành tiếp diễn',
            'Thì tương lai đơn', 'Thì tương lai tiếp diễn', 'Thì tương lai gần', 'Thì tương lai hoàn thành tiếp diễn',
            // Cấu trúc câu
            'Câu so sánh', 'Câu điều kiện', 'Câu điều ước', 'Câu giả định',
            'Câu chủ/bị động', 'Mệnh đề quan hệ', 'Câu mệnh lệnh', 'Câu hỏi đuôi',
            'Câu đảo ngữ', 'Câu tường thuật trực tiếp/gián tiếp'
        ],
        'Từ vựng': [
            // Từ loại
            'Đại từ', 'Danh từ', 'Tính từ', 'Động từ', 'Trạng từ',
            'Lượng từ', 'Giới từ', 'Mạo từ', 'Liên từ',
            // Cụm từ & thành ngữ
            'Cụm từ cố định (Collocations)', 'Thành ngữ (Idioms)', 'Cụm động từ (Phrasal Verbs)',
            'Từ đồng nghĩa/trái nghĩa'
        ],
        'Đọc hiểu': [
            'Đọc điền từ (Cloze test)', 'Tìm ý chính đoạn văn',
            'Câu hỏi chi tiết (According to the passage)', 'Câu hỏi suy luận (Inference)',
            'Tìm từ thay thế (Referent questions)',
            'Tìm từ đồng nghĩa (Synonym questions)', 'Tìm từ trái nghĩa (Opposite questions)',
            'Sắp xếp câu và đoạn văn'
        ]
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
    getStudentProgress,
    getIncorrectAnswersWithTags,
    getStudentSkillMap
};

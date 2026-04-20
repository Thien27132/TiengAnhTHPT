-- ===================================================================
-- FILE: analysisQueries.sql
-- MỤC ĐÍCH: Phân tích tỷ lệ sai theo Tag cho toàn bộ học sinh
-- ===================================================================

-- ====================================================================
-- 1. TỶ LỆ SAI THEO TAG (Toàn hệ thống)
-- ====================================================================
-- Query: Lấy tỷ lệ sai theo tag cho TẤT CẢ học sinh
CREATE PROCEDURE sp_GetErrorRateByTagSystem
AS
BEGIN
    SELECT 
        t.TagID,
        t.TagName,
        COUNT(DISTINCT rd.QuestionID) AS TotalQuestions,
        COUNT(DISTINCT rd.ResultID) AS TotalAttempts,
        SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) AS IncorrectCount,
        SUM(CASE WHEN rd.IsCorrect = 1 THEN 1 ELSE 0 END) AS CorrectCount,
        COUNT(DISTINCT er.StudentID) AS UniqueStudents,
        CAST(SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) * 100.0 / 
             COUNT(DISTINCT rd.QuestionID) AS DECIMAL(5,2)) AS ErrorRate,
        CAST(SUM(CASE WHEN rd.IsCorrect = 1 THEN 1 ELSE 0 END) * 100.0 / 
             COUNT(DISTINCT rd.QuestionID) AS DECIMAL(5,2)) AS SuccessRate
    FROM ResultDetail rd
    INNER JOIN ExamResults er ON rd.ResultID = er.ResultID
    INNER JOIN Questions q ON rd.QuestionID = q.QuestionID
    INNER JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
    INNER JOIN Tags t ON qt.TagID = t.TagID
    GROUP BY t.TagID, t.TagName
    ORDER BY ErrorRate DESC;
END;

-- ====================================================================
-- 2. TỶ LỀ SAI THEO TAG - CHI TIẾT (Từng học sinh)
-- ====================================================================
-- Query: Lấy tỷ lệ sai chi tiết cho từng học sinh
CREATE PROCEDURE sp_GetErrorRateByTagStudent
    @StudentID INT = NULL
AS
BEGIN
    SELECT 
        er.StudentID,
        u.UserName,
        t.TagID,
        t.TagName,
        COUNT(DISTINCT rd.QuestionID) AS TotalAttempted,
        SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) AS IncorrectCount,
        SUM(CASE WHEN rd.IsCorrect = 1 THEN 1 ELSE 0 END) AS CorrectCount,
        CAST(SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) * 100.0 / 
             COUNT(DISTINCT rd.QuestionID) AS DECIMAL(5,2)) AS ErrorRate
    FROM ResultDetail rd
    INNER JOIN ExamResults er ON rd.ResultID = er.ResultID
    INNER JOIN Users u ON er.StudentID = u.UserID
    INNER JOIN Questions q ON rd.QuestionID = q.QuestionID
    INNER JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
    INNER JOIN Tags t ON qt.TagID = t.TagID
    WHERE @StudentID IS NULL OR er.StudentID = @StudentID
    GROUP BY er.StudentID, u.UserName, t.TagID, t.TagName
    ORDER BY er.StudentID, ErrorRate DESC;
END;

-- ====================================================================
-- 3. BẢNG SO SÁNH TỶ LỆ SAI (Compare Students)
-- ====================================================================
-- Query: So sánh tỷ lệ sai của học sinh với trung bình chung
CREATE PROCEDURE sp_CompareErrorRateWithAverage
    @TagID INT = NULL
AS
BEGIN
    WITH StudentTagStats AS (
        SELECT 
            er.StudentID,
            u.UserName,
            t.TagID,
            t.TagName,
            COUNT(DISTINCT rd.QuestionID) AS AttemptCount,
            CAST(SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) * 100.0 / 
                 COUNT(DISTINCT rd.QuestionID) AS DECIMAL(5,2)) AS StudentErrorRate
        FROM ResultDetail rd
        INNER JOIN ExamResults er ON rd.ResultID = er.ResultID
        INNER JOIN Users u ON er.StudentID = u.UserID
        INNER JOIN Questions q ON rd.QuestionID = q.QuestionID
        INNER JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
        INNER JOIN Tags t ON qt.TagID = t.TagID
        WHERE @TagID IS NULL OR t.TagID = @TagID
        GROUP BY er.StudentID, u.UserName, t.TagID, t.TagName
    ),
    AvgStats AS (
        SELECT 
            t.TagID,
            t.TagName,
            AVG(CAST(SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) * 100.0 / 
                COUNT(DISTINCT rd.QuestionID) AS DECIMAL(5,2))) AS AvgErrorRate
        FROM ResultDetail rd
        INNER JOIN ExamResults er ON rd.ResultID = er.ResultID
        INNER JOIN Questions q ON rd.QuestionID = q.QuestionID
        INNER JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
        INNER JOIN Tags t ON qt.TagID = t.TagID
        WHERE @TagID IS NULL OR t.TagID = @TagID
        GROUP BY t.TagID, t.TagName
    )
    SELECT 
        s.StudentID,
        s.UserName,
        s.TagID,
        s.TagName,
        s.StudentErrorRate,
        a.AvgErrorRate,
        CAST(s.StudentErrorRate - a.AvgErrorRate AS DECIMAL(5,2)) AS Deviation,
        CASE 
            WHEN s.StudentErrorRate < a.AvgErrorRate - 5 THEN 'Tốt hơn'
            WHEN s.StudentErrorRate > a.AvgErrorRate + 5 THEN 'Kém hơn'
            ELSE 'Trung bình'
        END AS Performance,
        s.AttemptCount
    FROM StudentTagStats s
    INNER JOIN AvgStats a ON s.TagID = a.TagID
    ORDER BY s.TagID, s.StudentErrorRate DESC;
END;

-- ====================================================================
-- 4. XẾP HẠNG HỌC SINH THEO TAG
-- ====================================================================
-- Query: Xếp hạng học sinh từ tốt -> xấu theo từng tag
CREATE PROCEDURE sp_RankStudentsByTag
    @TagID INT = NULL
AS
BEGIN
    SELECT 
        ROW_NUMBER() OVER (PARTITION BY t.TagID ORDER BY ErrorRate ASC) AS Rank,
        er.StudentID,
        u.UserName,
        t.TagID,
        t.TagName,
        COUNT(DISTINCT rd.QuestionID) AS TotalAttempted,
        SUM(CASE WHEN rd.IsCorrect = 1 THEN 1 ELSE 0 END) AS CorrectCount,
        SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) AS IncorrectCount,
        CAST(SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) * 100.0 / 
             COUNT(DISTINCT rd.QuestionID) AS DECIMAL(5,2)) AS ErrorRate
    FROM ResultDetail rd
    INNER JOIN ExamResults er ON rd.ResultID = er.ResultID
    INNER JOIN Users u ON er.StudentID = u.UserID
    INNER JOIN Questions q ON rd.QuestionID = q.QuestionID
    INNER JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
    INNER JOIN Tags t ON qt.TagID = t.TagID
    WHERE @TagID IS NULL OR t.TagID = @TagID
    GROUP BY er.StudentID, u.UserName, t.TagID, t.TagName
    ORDER BY t.TagID, ErrorRate ASC;
END;

-- ====================================================================
-- 5. THỐNG KÊ PHÂN BỐ HỌC SINH THEO MỨC ĐỘ (Error Rate Groups)
-- ====================================================================
-- Query: Phân bố học sinh theo nhóm tỷ lệ sai
CREATE PROCEDURE sp_StudentDistributionByErrorRate
    @TagID INT = NULL
AS
BEGIN
    WITH StudentErrors AS (
        SELECT 
            er.StudentID,
            u.UserName,
            t.TagID,
            t.TagName,
            CAST(SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) * 100.0 / 
                 COUNT(DISTINCT rd.QuestionID) AS DECIMAL(5,2)) AS ErrorRate
        FROM ResultDetail rd
        INNER JOIN ExamResults er ON rd.ResultID = er.ResultID
        INNER JOIN Users u ON er.StudentID = u.UserID
        INNER JOIN Questions q ON rd.QuestionID = q.QuestionID
        INNER JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
        INNER JOIN Tags t ON qt.TagID = t.TagID
        WHERE @TagID IS NULL OR t.TagID = @TagID
        GROUP BY er.StudentID, u.UserName, t.TagID, t.TagName
    )
    SELECT 
        t.TagID,
        t.TagName,
        CASE 
            WHEN ErrorRate < 20 THEN 'Xuất sắc (< 20%)'
            WHEN ErrorRate < 40 THEN 'Tốt (20-40%)'
            WHEN ErrorRate < 60 THEN 'Khá (40-60%)'
            WHEN ErrorRate < 80 THEN 'Yếu (60-80%)'
            ELSE 'Rất yếu (> 80%)'
        END AS ErrorGroup,
        COUNT(*) AS StudentCount,
        CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY t.TagID) AS DECIMAL(5,2)) AS Percentage
    FROM StudentErrors se
    INNER JOIN Tags t ON se.TagID = t.TagID
    GROUP BY t.TagID, t.TagName,
        CASE 
            WHEN ErrorRate < 20 THEN 'Xuất sắc (< 20%)'
            WHEN ErrorRate < 40 THEN 'Tốt (20-40%)'
            WHEN ErrorRate < 60 THEN 'Khá (40-60%)'
            WHEN ErrorRate < 80 THEN 'Yếu (60-80%)'
            ELSE 'Rất yếu (> 80%)'
        END
    ORDER BY t.TagID, 
        CASE 
            WHEN ErrorRate < 20 THEN 1
            WHEN ErrorRate < 40 THEN 2
            WHEN ErrorRate < 60 THEN 3
            WHEN ErrorRate < 80 THEN 4
            ELSE 5
        END;
END;

-- ====================================================================
-- 6. VÀI TUẦN LUYỆN (Top Students & Weak Students)
-- ====================================================================
-- Query: Danh sách học sinh xuất sắc và học sinh cần hỗ trợ
CREATE PROCEDURE sp_GetStudentsFocusList
    @TagID INT = NULL,
    @TopCount INT = 5
AS
BEGIN
    WITH StudentErrors AS (
        SELECT TOP (@TopCount * 2)
            er.StudentID,
            u.UserName,
            t.TagID,
            t.TagName,
            CAST(SUM(CASE WHEN rd.IsCorrect = 0 THEN 1 ELSE 0 END) * 100.0 / 
                 COUNT(DISTINCT rd.QuestionID) AS DECIMAL(5,2)) AS ErrorRate
        FROM ResultDetail rd
        INNER JOIN ExamResults er ON rd.ResultID = er.ResultID
        INNER JOIN Users u ON er.StudentID = u.UserID
        INNER JOIN Questions q ON rd.QuestionID = q.QuestionID
        INNER JOIN Question_Tags qt ON q.QuestionID = qt.QuestionID
        INNER JOIN Tags t ON qt.TagID = t.TagID
        WHERE @TagID IS NULL OR t.TagID = @TagID
        GROUP BY er.StudentID, u.UserName, t.TagID, t.TagName
        ORDER BY t.TagID, ErrorRate DESC
    )
    SELECT 
        StudentID,
        UserName,
        TagID,
        TagName,
        ErrorRate,
        CASE 
            WHEN ErrorRate < 30 THEN '⭐ Xuất sắc'
            WHEN ErrorRate > 70 THEN '🔴 Cần hỗ trợ'
            ELSE '⚪ Trung bình'
        END AS Status
    FROM StudentErrors
    WHERE ErrorRate < 30 OR ErrorRate > 70
    ORDER BY TagID, ErrorRate;
END;

const sql = require('mssql');

const getRequiredQuestionCount = (questionType) => {
    const mapping = {
        Leaflet: 6,
        Ordering: 5,
        Context_Filling: 5,
        Reading_8: 8,
        Reading_10: 10
    };
    return mapping[questionType] || null;
};

const parseParentContent = (content) => {
    if (!content) return null;
    try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && ('prompt' in parsed || 'passage' in parsed)) {
            return parsed;
        }
    } catch (error) {
        // Nếu nội dung không phải JSON, xem nó như prompt thô
        return { prompt: content, passage: '' };
    }
    return { prompt: content, passage: '' };
};

const buildParentContent = (prompt, passage) => {
    return JSON.stringify({ prompt: prompt || '', passage: passage || '' });
};

const createQuestion = async (req, res) => {
    const { prompt, passage, level, tagIds, questionType, questions } = req.body;
    try {
        const requiredCount = getRequiredQuestionCount(questionType);
        if (!requiredCount) {
            return res.status(400).json({ message: 'Loại câu hỏi không hợp lệ.' });
        }

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập đề bài.' });
        }

        if (questionType !== 'Ordering' && (!passage || !passage.trim())) {
            return res.status(400).json({ message: 'Đoạn văn là bắt buộc cho loại đề này.' });
        }

        const minCount = questionType === 'Ordering' ? 1 : requiredCount;
        if (!Array.isArray(questions) || questions.length < minCount || (questionType !== 'Ordering' && questions.length !== requiredCount)) {
            return res.status(400).json({ message: questionType === 'Ordering'
                ? 'Ordering cần ít nhất 1 câu hỏi.'
                : `Yêu cầu phải có đúng ${requiredCount} câu hỏi cho loại ${questionType}.` });
        }

        for (const item of questions) {
            if (!Array.isArray(item.answers) || item.answers.length !== 4) {
                return res.status(400).json({ message: 'Mỗi câu hỏi phải có đủ 4 đáp án.' });
            }
            const correctAnswers = item.answers.filter(ans => ans.isCorrect);
            if (correctAnswers.length !== 1) {
                return res.status(400).json({ message: 'Mỗi câu hỏi cần đúng 1 đáp án đúng.' });
            }
        }

        const parentContent = buildParentContent(prompt, passage || '');
        const parentResult = await sql.query`
            INSERT INTO Questions (Content, Level, IsPassage, ParentID, QuestionType)
            OUTPUT INSERTED.QuestionID
            VALUES (${parentContent}, ${level}, 1, NULL, ${questionType})`;

        const parentQuestionId = parentResult.recordset[0].QuestionID;

        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
            for (const tagId of tagIds) {
                await sql.query`INSERT INTO Question_Tags (QuestionID, TagID) VALUES (${parentQuestionId}, ${tagId})`;
            }
        }

        for (const item of questions) {
            const childQuestionResult = await sql.query`
                INSERT INTO Questions (Content, Level, IsPassage, ParentID, QuestionType)
                OUTPUT INSERTED.QuestionID
                VALUES (${item.question || ''}, ${level}, 0, ${parentQuestionId}, ${questionType})`;
            const childQuestionId = childQuestionResult.recordset[0].QuestionID;

            if (item.tagIds && Array.isArray(item.tagIds) && item.tagIds.length > 0) {
                for (const tagId of item.tagIds) {
                    await sql.query`INSERT INTO Question_Tags (QuestionID, TagID) VALUES (${childQuestionId}, ${tagId})`;
                }
            }

            for (const ans of item.answers) {
                await sql.query`
                    INSERT INTO Answers (QuestionID, AnswerContent, IsCorrect, Explanation)
                    VALUES (${childQuestionId}, ${ans.content}, ${ans.isCorrect ? 1 : 0}, ${ans.explanation || ''})`;
            }
        }

        res.status(201).json({ message: 'Thêm bài tập thành công!', questionId: parentQuestionId });
    } catch (err) {
        console.error('createQuestion error:', err);
        res.status(500).json({ message: 'Lỗi Server', error: err.message });
    }
};

const getAllQuestions = async (req, res) => {
    try {
        const { type, q } = req.query;
        let queryStr = `
            SELECT q.*, ISNULL(child.ChildCount, 0) AS ChildCount,
                (SELECT t.TagID, t.TagName, s.SkillName FROM Tags t
                 JOIN Question_Tags qt ON t.TagID = qt.TagID
                 JOIN Skills s ON t.SkillID = s.SkillID
                 WHERE qt.QuestionID = q.QuestionID FOR JSON PATH) AS Tags
            FROM Questions q
            LEFT JOIN (
                SELECT ParentID, COUNT(*) AS ChildCount
                FROM Questions
                WHERE ParentID IS NOT NULL
                GROUP BY ParentID
            ) child ON child.ParentID = q.QuestionID
            WHERE q.ParentID IS NULL`;

        const request = new sql.Request();
        if (type) {
            queryStr += ` AND q.QuestionType = @typeParam`;
            request.input('typeParam', sql.NVarChar, type);
        }

        if (q) {
            request.input('query', sql.NVarChar, `%${q}%`);
            queryStr += ` AND (
                q.Content LIKE @query
                OR EXISTS (
                    SELECT 1 FROM Questions cq WHERE cq.ParentID = q.QuestionID AND cq.Content LIKE @query
                )
            )`;
        }

        queryStr += ` ORDER BY q.CreatedAt DESC`;
        const result = await request.query(queryStr);

        const data = result.recordset.map(item => {
            const parsedContent = parseParentContent(item.Content);
            return {
                ...item,
                Tags: item.Tags ? JSON.parse(item.Tags) : [],
                Prompt: parsedContent?.prompt || item.Content || '',
                Passage: parsedContent?.passage || '',
                ChildCount: item.ChildCount || 0
            };
        });

        res.json(data);
    } catch (err) {
        console.error('getAllQuestions error:', err);
        res.status(500).json({ message: 'Lỗi lấy danh sách', error: err.message });
    }
};

const getQuestionById = async (req, res) => {
    const { id } = req.params;
    try {
        const questionResult = await sql.query`
            SELECT * FROM Questions WHERE QuestionID = ${id}`;

        if (questionResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy câu hỏi' });
        }

        const requestedQuestion = questionResult.recordset[0];
        const parentId = requestedQuestion.ParentID || requestedQuestion.QuestionID;
        const parentQuestion = requestedQuestion.ParentID
            ? (await sql.query`SELECT * FROM Questions WHERE QuestionID = ${requestedQuestion.ParentID}`).recordset[0]
            : requestedQuestion;

        const tagsResult = await sql.query`
            SELECT t.TagID, t.TagName, s.SkillName
            FROM Tags t
            JOIN Question_Tags qt ON t.TagID = qt.TagID
            JOIN Skills s ON t.SkillID = s.SkillID
            WHERE qt.QuestionID = ${parentId}`;

        const childQuestionsResult = await sql.query`
            SELECT * FROM Questions WHERE ParentID = ${parentId} ORDER BY QuestionID ASC`;
        const childQuestions = childQuestionsResult.recordset;

        let answers = [];
        let questionTags = [];
        if (childQuestions.length > 0) {
            const childIds = childQuestions.map((item) => item.QuestionID);
            const answerRequest = new sql.Request();
            const idParams = childIds.map((value, index) => {
                answerRequest.input(`id${index}`, sql.Int, value);
                return `@id${index}`;
            }).join(', ');

            const answersResult = await answerRequest.query(`
                SELECT * FROM Answers
                WHERE QuestionID IN (${idParams})
                ORDER BY AnswerID ASC`);
            answers = answersResult.recordset;

            const tagRequest = new sql.Request();
            const tagParams = childIds.map((value, index) => {
                tagRequest.input(`tagId${index}`, sql.Int, value);
                return `@tagId${index}`;
            }).join(', ');

            const tagResult = await tagRequest.query(`
                SELECT qt.QuestionID, t.TagID, t.TagName, s.SkillName
                FROM Question_Tags qt
                JOIN Tags t ON qt.TagID = t.TagID
                JOIN Skills s ON t.SkillID = s.SkillID
                WHERE qt.QuestionID IN (${tagParams})`);
            questionTags = tagResult.recordset;
        }

        const answersByQuestion = {};
        answers.forEach((ans) => {
            if (!answersByQuestion[ans.QuestionID]) answersByQuestion[ans.QuestionID] = [];
            answersByQuestion[ans.QuestionID].push(ans);
        });

        const tagsByQuestion = {};
        questionTags.forEach((tag) => {
            if (!tagsByQuestion[tag.QuestionID]) tagsByQuestion[tag.QuestionID] = [];
            tagsByQuestion[tag.QuestionID].push(tag);
        });

        const parsedContent = parseParentContent(parentQuestion.Content);

        res.json({
            questionId: parentId,
            prompt: parsedContent?.prompt || '',
            passage: parsedContent?.passage || '',
            rawContent: parentQuestion.Content || '',
            level: parentQuestion.Level,
            questionType: parentQuestion.QuestionType,
            tagIds: tagsResult.recordset.map((tag) => tag.TagID),
            tags: tagsResult.recordset,
            questions: childQuestions.map((item) => ({
                questionId: item.QuestionID,
                questionContent: item.Content,
                rawQuestionContent: item.Content || '',
                tagIds: tagsByQuestion[item.QuestionID]?.map((tag) => tag.TagID) || [],
                tags: tagsByQuestion[item.QuestionID] || [],
                answers: answersByQuestion[item.QuestionID] || []
            }))
        });
    } catch (err) {
        console.error('getQuestionById error:', err);
        res.status(500).json({ message: 'Lỗi lấy chi tiết câu hỏi', error: err.message });
    }
};

const updateQuestion = async (req, res) => {
    const { id } = req.params;
    const { prompt, passage, level, tagIds, questionType, questions } = req.body;
    try {
        const requiredCount = getRequiredQuestionCount(questionType);
        if (!requiredCount) {
            return res.status(400).json({ message: 'Loại câu hỏi không hợp lệ.' });
        }

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập đề bài.' });
        }

        if (questionType !== 'Ordering' && (!passage || !passage.trim())) {
            return res.status(400).json({ message: 'Đoạn văn là bắt buộc cho loại đề này.' });
        }

        const minCount = questionType === 'Ordering' ? 1 : requiredCount;
        if (!Array.isArray(questions) || questions.length < minCount || (questionType !== 'Ordering' && questions.length !== requiredCount)) {
            return res.status(400).json({ message: questionType === 'Ordering'
                ? 'Ordering cần ít nhất 1 câu hỏi.'
                : `Yêu cầu phải có đúng ${requiredCount} câu hỏi cho loại ${questionType}.` });
        }

        for (const item of questions) {
            if (!Array.isArray(item.answers) || item.answers.length !== 4) {
                return res.status(400).json({ message: 'Mỗi câu hỏi phải có đủ 4 đáp án.' });
            }
            const correctAnswers = item.answers.filter(ans => ans.isCorrect);
            if (correctAnswers.length !== 1) {
                return res.status(400).json({ message: 'Mỗi câu hỏi cần đúng 1 đáp án đúng.' });
            }
        }

        const existingResult = await sql.query`
            SELECT * FROM Questions WHERE QuestionID = ${id}`;
        if (existingResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy câu hỏi để cập nhật.' });
        }

        const existingQuestion = existingResult.recordset[0];
        const parentId = existingQuestion.ParentID || existingQuestion.QuestionID;

        const content = buildParentContent(prompt, passage || '');
        await sql.query`
            UPDATE Questions
            SET Content = ${content}, Level = ${level}, IsPassage = 1, ParentID = NULL, QuestionType = ${questionType}
            WHERE QuestionID = ${parentId}`;

        await sql.query`DELETE FROM Question_Tags WHERE QuestionID = ${parentId}`;
        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
            for (const tagId of tagIds) {
                await sql.query`INSERT INTO Question_Tags (QuestionID, TagID) VALUES (${parentId}, ${tagId})`;
            }
        }

        const childQuestionIdsResult = await sql.query`
            SELECT QuestionID FROM Questions WHERE ParentID = ${parentId}`;
        const childQuestionIds = childQuestionIdsResult.recordset.map((item) => item.QuestionID);

        if (childQuestionIds.length > 0) {
            await sql.query`DELETE FROM Answers WHERE QuestionID IN (${childQuestionIds})`;
            await sql.query`DELETE FROM Questions WHERE ParentID = ${parentId}`;
        }

        for (const item of questions) {
            const childQuestionResult = await sql.query`
                INSERT INTO Questions (Content, Level, IsPassage, ParentID, QuestionType)
                OUTPUT INSERTED.QuestionID
                VALUES (${item.question || ''}, ${level}, 0, ${parentId}, ${questionType})`;
            const childQuestionId = childQuestionResult.recordset[0].QuestionID;

            if (item.tagIds && Array.isArray(item.tagIds) && item.tagIds.length > 0) {
                for (const tagId of item.tagIds) {
                    await sql.query`INSERT INTO Question_Tags (QuestionID, TagID) VALUES (${childQuestionId}, ${tagId})`;
                }
            }

            for (const ans of item.answers) {
                await sql.query`
                    INSERT INTO Answers (QuestionID, AnswerContent, IsCorrect, Explanation)
                    VALUES (${childQuestionId}, ${ans.content}, ${ans.isCorrect ? 1 : 0}, ${ans.explanation || ''})`;
            }
        }

        res.json({ message: 'Cập nhật bài tập thành công' });
    } catch (err) {
        console.error('updateQuestion error:', err);
        res.status(500).json({ message: 'Lỗi cập nhật câu hỏi', error: err.message });
    }
};

const deleteQuestion = async (req, res) => {
    const { id } = req.params;
    try {
        const questionResult = await sql.query`
            SELECT * FROM Questions WHERE QuestionID = ${id}`;
        if (questionResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy câu hỏi để xóa.' });
        }

        const question = questionResult.recordset[0];
        const parentId = question.ParentID || question.QuestionID;

        if (question.ParentID === null) {
            await sql.query`DELETE FROM Answers WHERE QuestionID IN (SELECT QuestionID FROM Questions WHERE ParentID = ${parentId})`;
            await sql.query`DELETE FROM Questions WHERE ParentID = ${parentId}`;
            await sql.query`DELETE FROM Question_Tags WHERE QuestionID = ${parentId}`;
            await sql.query`DELETE FROM Questions WHERE QuestionID = ${parentId}`;
        } else {
            await sql.query`DELETE FROM Answers WHERE QuestionID = ${id}`;
            await sql.query`DELETE FROM Question_Tags WHERE QuestionID = ${id}`;
            await sql.query`DELETE FROM Questions WHERE QuestionID = ${id}`;
        }

        res.json({ message: 'Xóa câu hỏi thành công' });
    } catch (err) {
        console.error('deleteQuestion error:', err);
        res.status(500).json({ message: 'Lỗi xóa câu hỏi', error: err.message });
    }
};

module.exports = {
    createQuestion,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion
};
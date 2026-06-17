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

const getDefaultPromptText = (questionType) => {
    const mapping = {
        Leaflet: 'Read the following leaflet/advertisement and mark a one on your answer sheet to indicate the best fit for each numbered blank.',
        Ordering: 'Mark a one on your answer sheet to indicate the best way to arrange sentences or words to form a meaningful dialogue or text for each of the following questions.',
        Context_Filling: 'Read the following passage and mark one on your answer sheet to indicate the best option for each numbered blank.',
        Reading_8: 'Read the following passage and mark one on your answer sheet to indicate the correct answer for each question.',
        Reading_10: 'Read the following passage and mark a one on your answer sheet to indicate the best answer for each of the following questions.'
    };
    return mapping[questionType] || '';
};

const parseParentContent = (content) => {
    if (!content) return null;
    try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && ('prompt' in parsed || 'passage' in parsed)) {
            return parsed;
        }
    } catch (error) {
        // Nếu nội dung không phải JSON, xem nó như passage (đoạn văn), không phải prompt
        return { prompt: '', passage: content };
    }
    return { prompt: '', passage: content };
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
        const { type, q, level } = req.query;
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

        if (level) {
            queryStr += ` AND q.Level = @levelParam`;
            request.input('levelParam', sql.NVarChar, level);
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
            const defaultPrompt = getDefaultPromptText(item.QuestionType);
            return {
                ...item,
                Tags: item.Tags ? JSON.parse(item.Tags) : [],
                Prompt: parsedContent?.prompt || defaultPrompt || '',
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
        const defaultPrompt = getDefaultPromptText(parentQuestion.QuestionType);

        res.json({
            questionId: parentId,
            prompt: parsedContent?.prompt || defaultPrompt || '',
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

        // Lấy danh sách câu con hiện tại (giữ nguyên QuestionID)
        const existingChildrenResult = await sql.query`
            SELECT QuestionID FROM Questions
            WHERE ParentID = ${parentId}
            ORDER BY QuestionID ASC`;
        const existingChildIds = existingChildrenResult.recordset.map(c => c.QuestionID);

        for (let i = 0; i < questions.length; i++) {
            const item = questions[i];
            let childQuestionId;

            if (i < existingChildIds.length) {
                // UPDATE câu con hiện có → giữ nguyên QuestionID
                childQuestionId = existingChildIds[i];
                await sql.query`
                    UPDATE Questions
                    SET Content = ${item.question || ''}, Level = ${level}, QuestionType = ${questionType}
                    WHERE QuestionID = ${childQuestionId}`;
            } else {
                // INSERT câu con mới (khi số câu tăng lên, ví dụ Ordering 3→5)
                const childResult = await sql.query`
                    INSERT INTO Questions (Content, Level, IsPassage, ParentID, QuestionType)
                    OUTPUT INSERTED.QuestionID
                    VALUES (${item.question || ''}, ${level}, 0, ${parentId}, ${questionType})`;
                childQuestionId = childResult.recordset[0].QuestionID;
            }

            // Question_Tags: xóa rồi insert lại (không có bảng nào trỏ đến Question_Tags)
            await sql.query`DELETE FROM Question_Tags WHERE QuestionID = ${childQuestionId}`;
            if (item.tagIds && Array.isArray(item.tagIds) && item.tagIds.length > 0) {
                for (const tagId of item.tagIds) {
                    await sql.query`INSERT INTO Question_Tags (QuestionID, TagID) VALUES (${childQuestionId}, ${tagId})`;
                }
            }

            // UPDATE đáp án hiện có → giữ nguyên AnswerID
            const existingAnswersResult = await sql.query`
                SELECT AnswerID FROM Answers
                WHERE QuestionID = ${childQuestionId}
                ORDER BY AnswerID ASC`;
            const existingAnswerIds = existingAnswersResult.recordset.map(a => a.AnswerID);

            for (let j = 0; j < item.answers.length; j++) {
                const ans = item.answers[j];
                if (j < existingAnswerIds.length) {
                    // UPDATE đáp án hiện có → giữ nguyên AnswerID
                    await sql.query`
                        UPDATE Answers
                        SET AnswerContent = ${ans.content}, IsCorrect = ${ans.isCorrect ? 1 : 0}, Explanation = ${ans.explanation || ''}
                        WHERE AnswerID = ${existingAnswerIds[j]}`;
                } else {
                    // INSERT đáp án mới (hiếm khi xảy ra vì luôn có 4 đáp án)
                    await sql.query`
                        INSERT INTO Answers (QuestionID, AnswerContent, IsCorrect, Explanation)
                        VALUES (${childQuestionId}, ${ans.content}, ${ans.isCorrect ? 1 : 0}, ${ans.explanation || ''})`;
                }
            }

            // Xóa đáp án thừa nếu số đáp án mới < số đáp án cũ
            if (existingAnswerIds.length > item.answers.length) {
                const extraAnswerIds = existingAnswerIds.slice(item.answers.length);
                for (const extraId of extraAnswerIds) {
                    await sql.query`DELETE FROM Answers WHERE AnswerID = ${extraId}`;
                }
            }
        }

        // Xóa câu con thừa nếu số câu mới < số câu cũ (ví dụ Ordering 5→3)
        if (existingChildIds.length > questions.length) {
            const extraChildIds = existingChildIds.slice(questions.length);
            for (const extraId of extraChildIds) {
                // CASCADE tự xóa Answers, Question_Tags, Exam_Questions, ResultDetail
                await sql.query`DELETE FROM Questions WHERE QuestionID = ${extraId}`;
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
            // Xóa câu con trước (ParentID FK là NO ACTION nên không tự CASCADE)
            // Khi xóa Questions → Answers, Question_Tags, Exam_Questions, ResultDetail tự CASCADE
            await sql.query`DELETE FROM Questions WHERE ParentID = ${parentId}`;
            await sql.query`DELETE FROM Questions WHERE QuestionID = ${parentId}`;
        } else {
            // Xóa câu con đơn lẻ → Answers, Question_Tags, Exam_Questions, ResultDetail tự CASCADE
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
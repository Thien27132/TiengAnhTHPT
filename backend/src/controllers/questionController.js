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

    // === DEBUG LOG ===
    console.log('=== createQuestion DEBUG ===');
    console.log('questionType:', questionType);
    console.log('tagIds:', JSON.stringify(tagIds));
    console.log('questions count:', questions?.length);
    if (questions && questions.length > 0) {
        questions.forEach((item, idx) => {
            console.log(`  Question[${idx}]:`, JSON.stringify({
                question: (item.question || '').substring(0, 50),
                tagIds: item.tagIds,
                answersCount: item.answers?.length,
                answers: item.answers?.map((a, j) => ({
                    contentLength: a.content?.length || 0,
                    contentPreview: (a.content || '').substring(0, 30),
                    isCorrect: a.isCorrect,
                    explanation: (a.explanation || '').substring(0, 20)
                }))
            }, null, 2));
        });
    }
    console.log('=== END DEBUG ===');

    // Validation trước khi mở transaction
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

    if (!Array.isArray(questions) || questions.length !== requiredCount) {
        return res.status(400).json({ message: `Yêu cầu phải có đúng ${requiredCount} câu hỏi cho loại ${questionType}.` });
    }

    for (let i = 0; i < questions.length; i++) {
        const item = questions[i];
        if (!Array.isArray(item.answers) || item.answers.length !== 4) {
            return res.status(400).json({ message: 'Mỗi câu hỏi phải có đủ 4 đáp án.' });
        }
        const correctAnswers = item.answers.filter(ans => ans.isCorrect);
        if (correctAnswers.length !== 1) {
            return res.status(400).json({ message: 'Mỗi câu hỏi cần đúng 1 đáp án đúng.' });
        }
        if (!Array.isArray(item.tagIds) || item.tagIds.length === 0) {
            return res.status(400).json({ message: `Câu ${i + 1} chưa được gán tag. Vui lòng chọn ít nhất 1 tag cho mỗi câu hỏi.` });
        }
    }

    const transaction = new sql.Transaction();
    try {
        await transaction.begin();

        const parentContent = buildParentContent(prompt, passage || '');
        const parentRequest = new sql.Request(transaction);
        parentRequest.input('content', sql.NVarChar, parentContent);
        parentRequest.input('level', sql.NVarChar, level);
        parentRequest.input('questionType', sql.NVarChar, questionType);
        const parentResult = await parentRequest.query(`
            INSERT INTO Questions (Content, Level, IsPassage, ParentID, QuestionType)
            OUTPUT INSERTED.QuestionID
            VALUES (@content, @level, 1, NULL, @questionType)`);

        const parentQuestionId = parentResult.recordset[0].QuestionID;

        // Insert parent tags
        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
            for (const tagId of tagIds) {
                const tagRequest = new sql.Request(transaction);
                tagRequest.input('questionId', sql.Int, parentQuestionId);
                tagRequest.input('tagId', sql.Int, tagId);
                await tagRequest.query('INSERT INTO Question_Tags (QuestionID, TagID) VALUES (@questionId, @tagId)');
            }
        }

        // Insert câu hỏi con
        for (const item of questions) {
            const childRequest = new sql.Request(transaction);
            childRequest.input('childContent', sql.NVarChar, item.question || '');
            childRequest.input('level', sql.NVarChar, level);
            childRequest.input('parentId', sql.Int, parentQuestionId);
            childRequest.input('questionType', sql.NVarChar, questionType);
            const childQuestionResult = await childRequest.query(`
                INSERT INTO Questions (Content, Level, IsPassage, ParentID, QuestionType)
                OUTPUT INSERTED.QuestionID
                VALUES (@childContent, @level, 0, @parentId, @questionType)`);
            const childQuestionId = childQuestionResult.recordset[0].QuestionID;

            // Insert tags cho câu hỏi con
            if (item.tagIds && Array.isArray(item.tagIds) && item.tagIds.length > 0) {
                for (const tagId of item.tagIds) {
                    const childTagRequest = new sql.Request(transaction);
                    childTagRequest.input('questionId', sql.Int, childQuestionId);
                    childTagRequest.input('tagId', sql.Int, tagId);
                    await childTagRequest.query('INSERT INTO Question_Tags (QuestionID, TagID) VALUES (@questionId, @tagId)');
                }
            }

            // Insert 4 answers cho câu hỏi con
            for (const ans of item.answers) {
                const ansRequest = new sql.Request(transaction);
                ansRequest.input('questionId', sql.Int, childQuestionId);
                ansRequest.input('answerContent', sql.NVarChar, ans.content);
                ansRequest.input('isCorrect', sql.Bit, ans.isCorrect ? 1 : 0);
                ansRequest.input('explanation', sql.NVarChar, ans.explanation || '');
                await ansRequest.query(`
                    INSERT INTO Answers (QuestionID, AnswerContent, IsCorrect, Explanation)
                    VALUES (@questionId, @answerContent, @isCorrect, @explanation)`);
            }
        }

        await transaction.commit();
        res.status(201).json({ message: 'Thêm bài tập thành công!', questionId: parentQuestionId });
    } catch (err) {
        // Rollback toàn bộ nếu có lỗi
        try { await transaction.rollback(); } catch (rollbackErr) { console.error('Rollback error:', rollbackErr); }
        console.error('createQuestion error:', err);
        res.status(500).json({ message: 'Lỗi Server', error: err.message });
    }
};

const getAllQuestions = async (req, res) => {
    try {
        // đếm số câu hỏi cha, rồi đếm các câu con của từng câu cha
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
        // tìm câu hỏi gốc, nếu tìm không thấy thì trả về lỗi
        const questionResult = await sql.query`
            SELECT * FROM Questions WHERE QuestionID = ${id}`;

        if (questionResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy câu hỏi' });
        }

        const requestedQuestion = questionResult.recordset[0];
        // nếu là câu hỏi con thì tìm câu hỏi cha, ngược lại thì tìm chính nó
        const parentId = requestedQuestion.ParentID || requestedQuestion.QuestionID;
        const parentQuestion = requestedQuestion.ParentID
            ? (await sql.query`SELECT * FROM Questions WHERE QuestionID = ${requestedQuestion.ParentID}`).recordset[0]
            : requestedQuestion;

        // tìm tag của câu hỏi cha
        const tagsResult = await sql.query`
            SELECT t.TagID, t.TagName, s.SkillName
            FROM Tags t
            JOIN Question_Tags qt ON t.TagID = qt.TagID
            JOIN Skills s ON t.SkillID = s.SkillID
            WHERE qt.QuestionID = ${parentId}`;

        // tìm các câu hỏi con    
        const childQuestionsResult = await sql.query`
            SELECT * FROM Questions WHERE ParentID = ${parentId} ORDER BY QuestionID ASC`;
        const childQuestions = childQuestionsResult.recordset;

        // tìm đáp án của câu hỏi con
        // tạo tham số động để thực hiện truy vấn đáp án, tags cho nhanh
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

        // tạo object chứa câu trả lời theo câu hỏi
        const answersByQuestion = {};
        answers.forEach((ans) => {
            if (!answersByQuestion[ans.QuestionID]) answersByQuestion[ans.QuestionID] = [];
            answersByQuestion[ans.QuestionID].push(ans);
        });

        // tạo object chứa tag theo câu hỏi
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

    // Validation trước khi mở transaction
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

    if (!Array.isArray(questions) || questions.length !== requiredCount) {
        return res.status(400).json({ message: `Yêu cầu phải có đúng ${requiredCount} câu hỏi cho loại ${questionType}.` });
    }

    for (let i = 0; i < questions.length; i++) {
        const item = questions[i];
        if (!Array.isArray(item.answers) || item.answers.length !== 4) {
            return res.status(400).json({ message: 'Mỗi câu hỏi phải có đủ 4 đáp án.' });
        }
        const correctAnswers = item.answers.filter(ans => ans.isCorrect);
        if (correctAnswers.length !== 1) {
            return res.status(400).json({ message: 'Mỗi câu hỏi cần đúng 1 đáp án đúng.' });
        }
        if (!Array.isArray(item.tagIds) || item.tagIds.length === 0) {
            return res.status(400).json({ message: `Câu ${i + 1} chưa được gán tag. Vui lòng chọn ít nhất 1 tag cho mỗi câu hỏi.` });
        }
    }

    // Kiểm tra tồn tại trước khi mở transaction
    const existingResult = await sql.query`
        SELECT * FROM Questions WHERE QuestionID = ${id}`;
    if (existingResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy câu hỏi để cập nhật.' });
    }

    const existingQuestion = existingResult.recordset[0];
    const parentId = existingQuestion.ParentID || existingQuestion.QuestionID;

    const transaction = new sql.Transaction();
    try {
        await transaction.begin();

        // Update câu hỏi cha
        const content = buildParentContent(prompt, passage || '');
        const updateParentReq = new sql.Request(transaction);
        updateParentReq.input('content', sql.NVarChar, content);
        updateParentReq.input('level', sql.NVarChar, level);
        updateParentReq.input('questionType', sql.NVarChar, questionType);
        updateParentReq.input('parentId', sql.Int, parentId);
        await updateParentReq.query(`
            UPDATE Questions
            SET Content = @content, Level = @level, IsPassage = 1, ParentID = NULL, QuestionType = @questionType
            WHERE QuestionID = @parentId`);

        // Update parent tags: xóa rồi insert lại
        const deleteParentTagsReq = new sql.Request(transaction);
        deleteParentTagsReq.input('parentId', sql.Int, parentId);
        await deleteParentTagsReq.query('DELETE FROM Question_Tags WHERE QuestionID = @parentId');
        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
            for (const tagId of tagIds) {
                const tagReq = new sql.Request(transaction);
                tagReq.input('questionId', sql.Int, parentId);
                tagReq.input('tagId', sql.Int, tagId);
                await tagReq.query('INSERT INTO Question_Tags (QuestionID, TagID) VALUES (@questionId, @tagId)');
            }
        }

        // Lấy danh sách câu con hiện tại (giữ nguyên QuestionID)
        const existingChildrenReq = new sql.Request(transaction);
        existingChildrenReq.input('parentId', sql.Int, parentId);
        const existingChildrenResult = await existingChildrenReq.query(`
            SELECT QuestionID FROM Questions
            WHERE ParentID = @parentId
            ORDER BY QuestionID ASC`);
        const existingChildIds = existingChildrenResult.recordset.map(c => c.QuestionID);

        for (let i = 0; i < questions.length; i++) {
            const item = questions[i];
            const childQuestionId = existingChildIds[i];

            // UPDATE câu con → giữ nguyên QuestionID
            const updateChildReq = new sql.Request(transaction);
            updateChildReq.input('childContent', sql.NVarChar, item.question || '');
            updateChildReq.input('level', sql.NVarChar, level);
            updateChildReq.input('questionType', sql.NVarChar, questionType);
            updateChildReq.input('childId', sql.Int, childQuestionId);
            await updateChildReq.query(`
                UPDATE Questions
                SET Content = @childContent, Level = @level, QuestionType = @questionType
                WHERE QuestionID = @childId`);

            // Question_Tags: xóa rồi insert lại
            const deleteChildTagsReq = new sql.Request(transaction);
            deleteChildTagsReq.input('childId', sql.Int, childQuestionId);
            await deleteChildTagsReq.query('DELETE FROM Question_Tags WHERE QuestionID = @childId');
            if (item.tagIds && Array.isArray(item.tagIds) && item.tagIds.length > 0) {
                for (const tagId of item.tagIds) {
                    const childTagReq = new sql.Request(transaction);
                    childTagReq.input('questionId', sql.Int, childQuestionId);
                    childTagReq.input('tagId', sql.Int, tagId);
                    await childTagReq.query('INSERT INTO Question_Tags (QuestionID, TagID) VALUES (@questionId, @tagId)');
                }
            }

            // UPDATE 4 đáp án → giữ nguyên AnswerID
            const existingAnswersReq = new sql.Request(transaction);
            existingAnswersReq.input('childId', sql.Int, childQuestionId);
            const existingAnswersResult = await existingAnswersReq.query(`
                SELECT AnswerID FROM Answers
                WHERE QuestionID = @childId
                ORDER BY AnswerID ASC`);
            const existingAnswerIds = existingAnswersResult.recordset.map(a => a.AnswerID);

            for (let j = 0; j < item.answers.length; j++) {
                const ans = item.answers[j];
                const updateAnsReq = new sql.Request(transaction);
                updateAnsReq.input('ansContent', sql.NVarChar, ans.content);
                updateAnsReq.input('isCorrect', sql.Bit, ans.isCorrect ? 1 : 0);
                updateAnsReq.input('explanation', sql.NVarChar, ans.explanation || '');
                updateAnsReq.input('answerId', sql.Int, existingAnswerIds[j]);
                await updateAnsReq.query(`
                    UPDATE Answers
                    SET AnswerContent = @ansContent, IsCorrect = @isCorrect, Explanation = @explanation
                    WHERE AnswerID = @answerId`);
            }
        }

        await transaction.commit();
        res.json({ message: 'Cập nhật bài tập thành công' });
    } catch (err) {
        // Rollback toàn bộ nếu có lỗi
        try { await transaction.rollback(); } catch (rollbackErr) { console.error('Rollback error:', rollbackErr); }
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
            // Xóa Question_Tags của các câu con
            await sql.query`DELETE FROM Question_Tags WHERE QuestionID IN (SELECT QuestionID FROM Questions WHERE ParentID = ${parentId})`;
            // Xóa Question_Tags của câu cha
            await sql.query`DELETE FROM Question_Tags WHERE QuestionID = ${parentId}`;
            // Xóa câu con rồi câu cha
            await sql.query`DELETE FROM Questions WHERE ParentID = ${parentId}`;
            await sql.query`DELETE FROM Questions WHERE QuestionID = ${parentId}`;
        } else {
            // Xóa Question_Tags của câu con đơn lẻ
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
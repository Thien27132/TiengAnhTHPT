import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import QuestionList from './QuestionManager/QuestionList';
import QuestionForm from './QuestionManager/QuestionForm';
import { createEmptyQuestion, getDefaultPrompt, getRequiredQuestionCount, normalizeQuestionCount } from './QuestionManager/utils';

const QuestionManager = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [rowDetails, setRowDetails] = useState({});
  const [rowLoading, setRowLoading] = useState({});
  const [form, setForm] = useState({
    prompt: '',
    passage: '',
    level: 'Trung bình',
    questionType: '',
    tagIds: [],
    tagSearch: '',
    questions: []
  });

  const resetForm = () => {
    setForm({
      prompt: '',
      passage: '',
      level: 'Trung bình',
      questionType: '',
      tagIds: [],
      tagSearch: '',
      questions: []
    });
    setEditingId(null);
  };

  const loadRowDetails = async (questionId) => {
    setRowLoading((prev) => ({ ...prev, [questionId]: true }));
    try {
      const data = await axiosClient.get(`/questions/${questionId}`);
      setRowDetails((prev) => ({ ...prev, [questionId]: data }));
      setExpandedRows((prev) => ({ ...prev, [questionId]: true }));
    } catch (error) {
      console.error('Lỗi lấy chi tiết đề', error);
      alert('Không thể tải chi tiết đề. Vui lòng thử lại.');
    } finally {
      setRowLoading((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const toggleRowDetails = async (question) => {
    const id = question.QuestionID;
    if (expandedRows[id]) {
      setExpandedRows((prev) => ({ ...prev, [id]: false }));
      return;
    }
    if (rowDetails[id]) {
      setExpandedRows((prev) => ({ ...prev, [id]: true }));
      return;
    }
    await loadRowDetails(id);
  };

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedType) params.set('type', selectedType);
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      const url = `/questions${params.toString() ? `?${params.toString()}` : ''}`;
      const data = await axiosClient.get(url);
      setQuestions(data);
    } catch (err) {
      console.error('Lỗi lấy danh sách câu hỏi', err);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const questionData = await axiosClient.get('/questions');
        setQuestions(questionData);
      } catch (error) {
        console.error('Lỗi lấy danh sách câu hỏi', error);
      }

      try {
        const tagData = await axiosClient.get('/tags');
        setTags(tagData);
      } catch (error) {
        console.error('Lỗi lấy tag', error);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedType]);

  const openEditModal = async (question) => {
    try {
      const data = await axiosClient.get(`/questions/${question.QuestionID}`);
      const count = getRequiredQuestionCount(data.questionType || 'Leaflet');
      const normalizedQuestions = normalizeQuestionCount(
        (data.questions || []).map((item) => ({
          question: item.questionContent || '',
          answers: item.answers.map((ans) => ({
            content: ans.AnswerContent || '',
            isCorrect: ans.IsCorrect === 1,
            explanation: ans.Explanation || ''
          })),
          tagIds: item.tagIds || [],
          tagSearch: ''
        })),
        count
      );
      setForm({
        prompt: data.prompt || getDefaultPrompt(data.questionType || 'Leaflet'),
        passage: data.passage || '',
        level: data.level || 'Trung bình',
        questionType: data.questionType || 'Leaflet',
        tagIds: data.tagIds || [],
        tagSearch: '',
        questions: normalizedQuestions
      });
      setEditingId(data.questionId);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Lỗi lấy chi tiết câu hỏi', err);
      alert('Không thể lấy chi tiết câu hỏi. Vui lòng thử lại.');
    }
  };

  const handleSaveQuestion = async () => {
    if (!form.prompt.trim()) {
      alert('Vui lòng nhập đề bài.');
      return;
    }

    if (form.questionType !== 'Ordering' && !form.passage.trim()) {
      alert('Đoạn văn là bắt buộc cho loại đề này.');
      return;
    }

    const requiredCount = getRequiredQuestionCount(form.questionType);
    if (form.questionType !== 'Ordering' && form.questions.length !== requiredCount) {
      alert(`Loại ${form.questionType} yêu cầu ${requiredCount} câu hỏi.`);
      return;
    }

    if (form.questionType === 'Ordering' && form.questions.length < 1) {
      alert('Ordering cần ít nhất 1 câu hỏi.');
      return;
    }

    for (let i = 0; i < form.questions.length; i += 1) {
      const questionItem = form.questions[i];
      if (!Array.isArray(questionItem.answers) || questionItem.answers.length !== 4) {
        alert(`Câu ${i + 1} phải có đủ 4 đáp án.`);
        return;
      }
      const correctCount = questionItem.answers.filter((ans) => ans.isCorrect).length;
      if (correctCount !== 1) {
        alert(`Câu ${i + 1} cần đúng 1 đáp án đúng.`);
        return;
      }
      if (!questionItem.answers.every((ans) => ans.content.trim())) {
        alert(`Vui lòng nhập đầy đủ nội dung 4 đáp án cho câu ${i + 1}.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        prompt: form.prompt,
        passage: form.passage,
        level: form.level,
        questionType: form.questionType,
        tagIds: [...new Set(form.questions.flatMap((item) => item.tagIds || []))],
        questions: form.questions.map((item) => ({
          question: item.question || '',
          tagIds: item.tagIds || [],
          answers: item.answers
        }))
      };

      if (editingId) {
        await axiosClient.put(`/questions/${editingId}`, payload);
        alert('Cập nhật câu hỏi thành công');
      } else {
        await axiosClient.post('/questions', payload);
        alert('Thêm câu hỏi thành công');
      }

      setIsModalOpen(false);
      resetForm();
      fetchQuestions();
    } catch (err) {
      console.error('Lỗi lưu câu hỏi', err);
      alert('Lỗi lưu câu hỏi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    try {
      await axiosClient.delete(`/questions/${questionId}`);
      fetchQuestions();
      alert('Xóa câu hỏi thành công');
    } catch (err) {
      console.error('Lỗi xóa câu hỏi', err);
      alert('Xóa không thành công.');
    }
  };

  const handleViewDetail = (questionId) => {
    navigate(`/admin/questions/${questionId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ngân hàng câu hỏi</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý tìm kiếm, lọc, và tạo đề bài theo loại.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={18} />
          Thêm đề mới
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm đề bài hoặc nội dung..."
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={fetchQuestions}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 transition"
          >
            Tìm
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả loại</option>
            <option value="Leaflet">Leaflet</option>
            <option value="Ordering">Ordering</option>
            <option value="Context_Filling">Context Filling</option>
            <option value="Reading_8">Reading 8</option>
            <option value="Reading_10">Reading 10</option>
          </select>
        </div>
      </div>

      <QuestionList
        questions={questions}
        expandedRows={expandedRows}
        rowDetails={rowDetails}
        rowLoading={rowLoading}
        onToggleRowDetails={toggleRowDetails}
        onEdit={openEditModal}
        onDelete={handleDeleteQuestion}
        onViewDetail={handleViewDetail}
      />

      <QuestionForm
        isModalOpen={isModalOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        tags={tags}
        isLoading={isLoading}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        onSave={handleSaveQuestion}
      />
    </div>
  );
};

export default QuestionManager;

  const getFilteredTags = (search) => {
    const lowerSearch = search.toLowerCase();
    return tags.filter((tag) =>
      !lowerSearch ||
      tag.TagName.toLowerCase().includes(lowerSearch) ||
      (tag.SkillName && tag.SkillName.toLowerCase().includes(lowerSearch))
    );
  };

  const updateFormFieldValue = (fieldKey, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        questions: prev.questions.map((question) => ({
          ...question,
          answers: question.answers.map((answer) => ({ ...answer }))
        }))
      };

      if (fieldKey === 'passage') {
        next.passage = value;
        return next;
      }

      const parts = fieldKey.split('.');
      if (parts[0] !== 'questions') return next;

      const questionIndex = Number(parts[1]);
      const questionItem = { ...next.questions[questionIndex], answers: next.questions[questionIndex].answers.map((answer) => ({ ...answer })) };

      if (parts[2] === 'question') {
        questionItem.question = value;
      } else if (parts[2] === 'answers') {
        const answerIndex = Number(parts[3]);
        const field = parts[4];
        questionItem.answers[answerIndex] = { ...questionItem.answers[answerIndex], [field]: value };
      }

      next.questions[questionIndex] = questionItem;
      return next;
    });
  };

  const applyFormatting = (type) => {
    const fieldKey = activeField;
    const fieldRef = textareaRefs.current[fieldKey];
    if (!fieldRef) return;

    fieldRef.focus();
    if (type === 'bold') {
      document.execCommand('bold', false, null);
    } else if (type === 'italic') {
      document.execCommand('italic', false, null);
    } else if (type === 'underline') {
      document.execCommand('underline', false, null);
    } else if (type === 'center') {
      document.execCommand('justifyCenter', false, null);
    } else if (type === 'tab') {
      document.execCommand('insertHTML', false, '&emsp;');
    }

    window.requestAnimationFrame(() => {
      const html = fieldRef.innerHTML;
      updateFormFieldValue(fieldKey, html === '<br>' ? '' : html);
    });
  };

  const renderChildCount = (q) => (q.QuestionType === 'Ordering' ? 1 : q.ChildCount || 0);

  const loadRowDetails = async (questionId) => {
    setRowLoading((prev) => ({ ...prev, [questionId]: true }));
    try {
      const data = await axiosClient.get(`/questions/${questionId}`);
      setRowDetails((prev) => ({ ...prev, [questionId]: data }));
      setExpandedRows((prev) => ({ ...prev, [questionId]: true }));
    } catch (error) {
      console.error('Lỗi lấy chi tiết đề', error);
      alert('Không thể tải chi tiết đề. Vui lòng thử lại.');
    } finally {
      setRowLoading((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const toggleRowDetails = async (question) => {
    const id = question.QuestionID;
    if (expandedRows[id]) {
      setExpandedRows((prev) => ({ ...prev, [id]: false }));
      return;
    }
    if (rowDetails[id]) {
      setExpandedRows((prev) => ({ ...prev, [id]: true }));
      return;
    }
    await loadRowDetails(id);
  };

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedType) params.set('type', selectedType);
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      const url = `/questions${params.toString() ? `?${params.toString()}` : ''}`;
      const data = await axiosClient.get(url);
      setQuestions(data);
    } catch (err) {
      console.error('Lỗi lấy danh sách câu hỏi', err);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const questionData = await axiosClient.get('/questions');
        setQuestions(questionData);
      } catch (error) {
        console.error('Lỗi lấy danh sách câu hỏi', error);
      }

      try {
        const tagData = await axiosClient.get('/tags');
        setTags(tagData);
      } catch (error) {
        console.error('Lỗi lấy tag', error);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    const loadByType = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedType) params.set('type', selectedType);
        const url = `/questions${params.toString() ? `?${params.toString()}` : ''}`;
        const questionData = await axiosClient.get(url);
        setQuestions(questionData);
      } catch (error) {
        console.error('Lỗi lấy danh sách câu hỏi', error);
      }
    };
    loadByType();
  }, [selectedType]);

  const setCorrectAnswer = (questionIndex, answerIndex) => {
    setForm((prev) => {
      const questionsCopy = [...prev.questions];
      questionsCopy[questionIndex] = {
        ...questionsCopy[questionIndex],
        answers: questionsCopy[questionIndex].answers.map((ans, idx) => ({
          ...ans,
          isCorrect: idx === answerIndex
        }))
      };
      return { ...prev, questions: questionsCopy };
    });
  };

  const handleAnswerFieldChange = (questionIndex, answerIndex, field, value) => {
    setForm((prev) => {
      const questionsCopy = [...prev.questions];
      const answersCopy = [...questionsCopy[questionIndex].answers];
      answersCopy[answerIndex] = { ...answersCopy[answerIndex], [field]: value };
      questionsCopy[questionIndex] = { ...questionsCopy[questionIndex], answers: answersCopy };
      return { ...prev, questions: questionsCopy };
    });
  };

  const openEditModal = async (question) => {
    try {
      const data = await axiosClient.get(`/questions/${question.QuestionID}`);
      const count = getRequiredQuestionCount(data.questionType || 'Leaflet');
      const normalizedQuestions = normalizeQuestionCount(
        (data.questions || []).map((item) => ({
          question: item.questionContent || '',
          answers: item.answers.map((ans) => ({
            content: ans.AnswerContent || '',
            isCorrect: ans.IsCorrect === 1,
            explanation: ans.Explanation || ''
          })),
          tagIds: item.tagIds || [],
          tagSearch: ''
        })),
        count
      );
      setForm({
        prompt: data.prompt || getDefaultPrompt(data.questionType || 'Leaflet'),
        passage: data.passage || '',
        level: data.level || 'Trung bình',
        questionType: data.questionType || 'Leaflet',
        tagIds: data.tagIds || [],
        tagSearch: '',
        questions: normalizedQuestions
      });
      setEditingId(data.questionId);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Lỗi lấy chi tiết câu hỏi', err);
      alert('Không thể lấy chi tiết câu hỏi. Vui lòng thử lại.');
    }
  };

  const resetForm = () => {
    setForm({
      prompt: '',
      passage: '',
      level: 'Trung bình',
      questionType: '',
      tagIds: [],
      tagSearch: '',
      questions: []
    });
    setEditingId(null);
  };

  const handleSaveQuestion = async () => {
    if (!form.prompt.trim()) {
      alert('Vui lòng nhập đề bài.');
      return;
    }

    if (form.questionType !== 'Ordering' && !form.passage.trim()) {
      alert('Đoạn văn là bắt buộc cho loại đề này.');
      return;
    }

    const requiredCount = getRequiredQuestionCount(form.questionType);
    if (form.questionType !== 'Ordering' && form.questions.length !== requiredCount) {
      alert(`Loại ${form.questionType} yêu cầu ${requiredCount} câu hỏi.`);
      return;
    }

    if (form.questionType === 'Ordering' && form.questions.length < 1) {
      alert('Ordering cần ít nhất 1 câu hỏi.');
      return;
    }

    for (let i = 0; i < form.questions.length; i += 1) {
      const questionItem = form.questions[i];
      if (!Array.isArray(questionItem.answers) || questionItem.answers.length !== 4) {
        alert(`Câu ${i + 1} phải có đủ 4 đáp án.`);
        return;
      }
      const correctCount = questionItem.answers.filter((ans) => ans.isCorrect).length;
      if (correctCount !== 1) {
        alert(`Câu ${i + 1} cần đúng 1 đáp án đúng.`);
        return;
      }
      if (!questionItem.answers.every((ans) => ans.content.trim())) {
        alert(`Vui lòng nhập đầy đủ nội dung 4 đáp án cho câu ${i + 1}.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        prompt: form.prompt,
        passage: form.passage,
        level: form.level,
        questionType: form.questionType,
        tagIds: [...new Set(form.questions.flatMap((item) => item.tagIds || []))],
        questions: form.questions.map((item) => ({
          question: item.question || '',
          tagIds: item.tagIds || [],
          answers: item.answers
        }))
      };

      if (editingId) {
        await axiosClient.put(`/questions/${editingId}`, payload);
        alert('Cập nhật câu hỏi thành công');
      } else {
        await axiosClient.post('/questions', payload);
        alert('Thêm câu hỏi thành công');
      }

      setIsModalOpen(false);
      resetForm();
      fetchQuestions();
    } catch (err) {
      console.error('Lỗi lưu câu hỏi', err);
      alert('Lỗi lưu câu hỏi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    try {
      await axiosClient.delete(`/questions/${questionId}`);
      fetchQuestions();
      alert('Xóa câu hỏi thành công');
    } catch (err) {
      console.error('Lỗi xóa câu hỏi', err);
      alert('Xóa không thành công.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ngân hàng câu hỏi</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý tìm kiếm, lọc, và tạo đề bài theo loại.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={18} />
          Thêm đề mới
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm đề bài hoặc nội dung..."
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={fetchQuestions}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 transition"
          >
            Tìm
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả loại</option>
            <option value="Leaflet">Leaflet</option>
            <option value="Ordering">Ordering</option>
            <option value="Context_Filling">Context Filling</option>
            <option value="Reading_8">Reading 8</option>
            <option value="Reading_10">Reading 10</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 uppercase text-sm">
              <th className="p-4 border-b">Đề bài</th>
              <th className="p-4 border-b">Tags / Kỹ năng</th>
              <th className="p-4 border-b">Loại</th>
              <th className="p-4 border-b">Số câu</th>
              <th className="p-4 border-b">Mức độ</th>
              <th className="p-4 border-b">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">
                  Không tìm thấy đề nào. Vui lòng thử lại với từ khóa khác hoặc tạo mới.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <React.Fragment key={q.QuestionID}>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="p-4 border-b max-w-xl break-words">
                      <div className="mb-2 text-gray-700 text-sm font-semibold" dangerouslySetInnerHTML={{ __html: q.Prompt || 'Không có đề bài rõ ràng' }} />
                      {q.Passage && (
                        <div className="text-xs text-gray-500 line-clamp-3" dangerouslySetInnerHTML={{ __html: q.Passage }} />
                      )}
                    </td>
                    <td className="p-4 border-b text-sm">
                      <div className="flex flex-wrap gap-2">
                        {(q.Tags || []).map((tag) => (
                          <span key={tag.TagID} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                            {tag.TagName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 border-b text-sm">{q.QuestionType}</td>
                    <td className="p-4 border-b text-sm">{renderChildCount(q)}</td>
                    <td className="p-4 border-b text-sm">{q.Level}</td>
                    <td className="p-4 border-b">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleRowDetails(q)}
                          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
                        >
                          {expandedRows[q.QuestionID] ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                        </button>
                        <button
                          onClick={() => openEditModal(q)}
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} /> Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.QuestionID)}
                          className="inline-flex items-center gap-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows[q.QuestionID] && (
                    <tr className="bg-slate-50">
                      <td colSpan="6" className="p-4 border-b">
                        {rowLoading[q.QuestionID] ? (
                          <div className="text-sm text-gray-600">Đang tải chi tiết...</div>
                        ) : (
                          <div className="space-y-4">
                            {(rowDetails[q.QuestionID]?.questions || []).map((item, idx) => (
                              <div key={item.questionId || idx} className="rounded-3xl border border-gray-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                  <div className="text-sm font-semibold">Câu {idx + 1}</div>
                                  <span className="text-xs text-gray-500">Loại: {rowDetails[q.QuestionID]?.questionType || q.QuestionType}</span>
                                </div>
                                {item.questionContent ? (
                                  <div className="text-sm text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: item.questionContent }} />
                                ) : (
                                  <div className="text-sm text-gray-500 mb-3">Không có nội dung câu hỏi.</div>
                                )}
                                <div className="grid gap-3">
                                  {(item.answers || []).map((ans, ansIdx) => (
                                    <div key={ans.AnswerID || ansIdx} className={`rounded-3xl border p-3 ${ans.IsCorrect === 1 || ans.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-slate-50'}`}>
                                      <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
                                        <span>{String.fromCharCode(65 + ansIdx)}.</span>
                                        {(ans.IsCorrect === 1 || ans.isCorrect) && <span className="text-emerald-700">Đúng</span>}
                                      </div>
                                      <div className="mt-2 text-gray-700" dangerouslySetInnerHTML={{ __html: ans.AnswerContent || ans.content || '' }} />
                                      {(ans.Explanation || ans.explanation) && (
                                        <div className="mt-2 text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: ans.Explanation || ans.explanation || '' }} />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-6xl bg-white rounded-3xl p-6 shadow-2xl overflow-auto max-h-[90vh]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Sửa đề bài' : 'Tạo đề bài mới'}</h3>
                <p className="text-sm text-gray-500">Nhập đầy đủ đề bài, passage, câu hỏi và đáp án cho từng loại.</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-500 hover:text-gray-900">Đóng</button>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => applyFormatting('bold')}
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('italic')}
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('underline')}
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('center')}
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('tab')}
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                  >
                    Tab
                  </button>
                </div>
                <div className="text-xs text-gray-500">Chọn ô nhập và nhấn nút để áp dụng định dạng HTML.</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full rounded-3xl border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại đề</label>
                  <select
                    value={form.questionType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        questionType: type,
                        prompt: getDefaultPrompt(type),
                        questions: normalizeQuestionCount(prev.questions, getRequiredQuestionCount(type))
                      }));
                    }}
                    className="w-full rounded-3xl border border-gray-300 p-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="Leaflet">Leaflet</option>
                    <option value="Ordering">Ordering</option>
                    <option value="Context_Filling">Context Filling</option>
                    <option value="Reading_8">Reading 8</option>
                    <option value="Reading_10">Reading 10</option>
                  </select>
                </div>
                <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-700">
                  <p className="text-xs text-gray-500">Đề bài tự động:</p>
                  <div className="mt-2 rounded-2xl bg-white p-3 text-sm text-gray-700 border border-gray-200" dangerouslySetInnerHTML={{ __html: form.prompt }} />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đoạn văn</label>
                  <div
                    ref={(el) => { textareaRefs.current.passage = el; }}
                    onFocus={() => setActiveField('passage')}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => updateFormFieldValue('passage', e.currentTarget.innerHTML)}
                    className="min-h-[150px] w-full rounded-3xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nhập đoạn văn cho bài đọc. Có thể để trống nếu dạng Ordering."
                    dangerouslySetInnerHTML={{ __html: form.passage }}
                  />
                  <p className="mt-2 text-xs text-gray-500">Dùng các nút In đậm, Nghiêng, Gạch chân, Căn giữa, Thụt lề để định dạng nội dung và xem trực quan. HTML chỉ lưu khi gửi.</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">Các câu hỏi thành phần</h4>
                      <p className="text-sm text-gray-500">Tạo đáp án và gán tag cho từng câu hỏi.</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div>Số lượng: {getVisibleQuestionCount()}</div>
                      {form.questionType === 'Ordering' && (
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="rounded-3xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition"
                        >
                          Thêm câu hỏi
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-5">
                    {form.questions.map((questionItem, questionIndex) => {
                      const selectedTags = tags.filter((tag) => questionItem.tagIds.includes(tag.TagID));
                      return (
                        <div key={questionIndex} className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                          <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
                            <div className="space-y-4">
                              <div className="mb-4">
                                <div className="flex items-center justify-between gap-3">
                                  <h5 className="font-semibold text-gray-800">Câu {questionIndex + 1}</h5>
                                  <span className="text-xs text-gray-500">Chọn đúng 1 đáp án</span>
                                </div>
                                <div
                                  ref={(el) => { textareaRefs.current[`questions.${questionIndex}.question`] = el; }}
                                  onFocus={() => setActiveField(`questions.${questionIndex}.question`)}
                                  contentEditable
                                  suppressContentEditableWarning
                                  onInput={(e) => updateFormFieldValue(`questions.${questionIndex}.question`, e.currentTarget.innerHTML)}
                                  className="mt-3 min-h-[60px] w-full rounded-3xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  dangerouslySetInnerHTML={{ __html: questionItem.question }}
                                  placeholder="Nội dung câu hỏi (có thể để trống cho Ordering)"
                                />
                              </div>
                              <div className="grid gap-3">
                                {questionItem.answers.map((answer, answerIndex) => (
                                  <div key={answerIndex} className="grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-12 sm:col-span-1 flex justify-center">
                                      <input
                                        type="radio"
                                        name={`correct-${questionIndex}`}
                                        checked={answer.isCorrect}
                                        onChange={() => setCorrectAnswer(questionIndex, answerIndex)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300"
                                      />
                                    </div>
                                    <div className="col-span-12 sm:col-span-5">
                                      <div className="text-xs font-semibold text-gray-600">Đáp án {answerIndex + 1}</div>
                                      <div
                                        ref={(el) => { textareaRefs.current[`questions.${questionIndex}.answers.${answerIndex}.content`] = el; }}
                                        onFocus={() => setActiveField(`questions.${questionIndex}.answers.${answerIndex}.content`)}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(e) => handleAnswerFieldChange(questionIndex, answerIndex, 'content', e.currentTarget.innerHTML)}
                                        className="mt-2 min-h-[60px] w-full rounded-3xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        dangerouslySetInnerHTML={{ __html: answer.content }}
                                        placeholder={`Đáp án ${answerIndex + 1}`}
                                      />
                                    </div>
                                    <div className="col-span-12 sm:col-span-6">
                                      <div className="text-xs font-semibold text-gray-600">Giải thích</div>
                                      <div
                                        ref={(el) => { textareaRefs.current[`questions.${questionIndex}.answers.${answerIndex}.explanation`] = el; }}
                                        onFocus={() => setActiveField(`questions.${questionIndex}.answers.${answerIndex}.explanation`)}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(e) => handleAnswerFieldChange(questionIndex, answerIndex, 'explanation', e.currentTarget.innerHTML)}
                                        className="mt-2 min-h-[60px] w-full rounded-3xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        dangerouslySetInnerHTML={{ __html: answer.explanation }}
                                        placeholder="Giải thích (tùy chọn)"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-3xl border border-gray-200 bg-white p-4">
                              <div className="flex items-center justify-between mb-3 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Tag</label>
                                  <p className="text-xs text-gray-500">Gán tag cho câu hỏi này</p>
                                </div>
                                {form.questionType === 'Ordering' && form.questions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeQuestion(questionIndex)}
                                    className="text-sm text-red-600 hover:underline"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                              {selectedTags.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                  {selectedTags.map((tag) => (
                                    <span key={tag.TagID} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                                      {tag.TagName}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <input
                                value={questionItem.tagSearch}
                                onChange={(e) => updateQuestionTagSearch(questionIndex, e.target.value)}
                                placeholder="Tìm tag..."
                                className="w-full rounded-3xl border border-gray-300 px-4 py-3 outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <div className="mt-3 max-h-52 overflow-y-auto space-y-2 pr-1">
                                {getFilteredTags(questionItem.tagSearch).length === 0 ? (
                                  <div className="text-sm text-gray-500">Không tìm thấy tag phù hợp.</div>
                                ) : (
                                  getFilteredTags(questionItem.tagSearch).map((tag) => (
                                    <button
                                      key={tag.TagID}
                                      type="button"
                                      onClick={() => toggleQuestionTag(questionIndex, tag.TagID)}
                                      className={`w-full text-left rounded-3xl border px-4 py-3 transition ${questionItem.tagIds.includes(tag.TagID) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-slate-50'}`}
                                    >
                                      <div className="font-semibold">{tag.TagName}</div>
                                      {tag.SkillName && <div className="text-xs text-gray-400">{tag.SkillName}</div>}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="rounded-3xl border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100 transition"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  disabled={isLoading}
                  className={`rounded-3xl px-6 py-3 text-white ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isLoading ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Lưu đề bài'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManager;

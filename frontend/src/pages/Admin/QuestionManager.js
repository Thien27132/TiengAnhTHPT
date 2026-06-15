import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import QuestionList from './QuestionManager/QuestionList';
import QuestionForm from './QuestionManager/QuestionForm';
import { getDefaultPrompt, getRequiredQuestionCount, normalizeQuestionCount } from './QuestionManager/utils';

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
    const defaultType = 'Leaflet';
    setForm({
      prompt: getDefaultPrompt(defaultType),
      passage: '',
      level: 'Trung bình',
      questionType: defaultType,
      tagIds: [],
      tagSearch: '',
      questions: normalizeQuestionCount([], getRequiredQuestionCount(defaultType))
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

  const fetchQuestions = useCallback(async () => {
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
  }, [selectedType, searchTerm]);

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
  }, [fetchQuestions]);

  const openEditModal = async (question) => {
    try {
      const data = await axiosClient.get(`/questions/${question.QuestionID}`);
      const count = getRequiredQuestionCount(data.questionType || 'Leaflet');
      const normalizedQuestions = normalizeQuestionCount(
        (data.questions || []).map((item) => ({
          question: item.questionContent || '',
          answers: (item.answers || []).map((ans) => ({
            content: ans.AnswerContent || ans.content || '',
            isCorrect: Boolean(ans.IsCorrect) || Boolean(ans.isCorrect),
            explanation: ans.Explanation || ans.explanation || ''
          })),
          tagIds: item.tagIds && Array.isArray(item.tagIds) ? item.tagIds : [],
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
          Thêm câu hỏi mới
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

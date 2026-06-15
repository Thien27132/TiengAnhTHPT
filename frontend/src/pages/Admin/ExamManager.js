import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Plus, Trash2, Clock, BookOpen, Eye } from 'lucide-react';

const ExamManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [exams, setExams] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isQuestionSelectorOpen, setIsQuestionSelectorOpen] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [selectedQuestionLevel, setSelectedQuestionLevel] = useState('');
  const [nextExamNumber, setNextExamNumber] = useState(1);
  const [formData, setFormData] = useState({
      examName: 'Đề thi thử THPT Quốc Gia - Số 1',
      level: 'Trung bình',
      duration: 50, // Mặc định 50 phút
      note: '',
      mode: 'auto',
      selectedQuestionIds: []
  });

  // Ràng buộc số lượng theo loại
  // Ordering: đếm theo tổng số câu con (ChildCount) → cần đủ 5 câu
  // Các loại khác: đếm theo số bài (parent questions)
  const EXAM_REQUIREMENTS = {
    Leaflet: { count: 2, unit: 'bài' },        // 2 bài × 6 câu = 12 câu
    Ordering: { count: 5, unit: 'câu' },        // gộp các bài Ordering → cần đủ 5 câu con
    Context_Filling: { count: 1, unit: 'bài' }, // 1 bài × 5 câu = 5 câu
    Reading_8: { count: 1, unit: 'bài' },       // 1 bài × 8 câu = 8 câu
    Reading_10: { count: 1, unit: 'bài' }       // 1 bài × 10 câu = 10 câu
  };

  // Hàm kiểm tra ràng buộc số lượng câu hỏi
  const validateSelection = (selectedIds) => {
    const selectedQuestions = bankQuestions.filter(q => selectedIds.includes(q.QuestionID));
    const typeCounts = {};

    selectedQuestions.forEach(question => {
      const type = question.QuestionType;
      if (!typeCounts[type]) {
        typeCounts[type] = 0;
      }
      // Ordering: đếm tổng số câu con (ChildCount)
      // Các loại khác: đếm số bài (mỗi parent = 1)
      if (type === 'Ordering') {
        typeCounts[type] += (question.ChildCount || 0);
      } else {
        typeCounts[type] += 1;
      }
    });

    const errors = [];
    const warnings = [];

    // Kiểm tra từng loại
    Object.keys(EXAM_REQUIREMENTS).forEach(type => {
      const { count: required, unit } = EXAM_REQUIREMENTS[type];
      const selected = typeCounts[type] || 0;

      if (selected < required) {
        errors.push(`${type}: cần ${required} ${unit}, hiện tại ${selected} ${unit}`);
      } else if (selected > required) {
        warnings.push(`${type}: vượt quá ${required} ${unit}, hiện tại ${selected} ${unit}`);
      }
    });

    return { errors, warnings, typeCounts };
  };

  const fetchExams = async () => {
    try {
      const data = await axiosClient.get('/exams'); // Dùng axiosClient của bạn
      setExams(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách đề thi");
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchExams();
      try {
        const data = await axiosClient.get('/questions');
        setBankQuestions(data);
      } catch (err) {
        console.error('Lỗi lấy ngân hàng câu hỏi', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (location.state?.openQuestionSelector) {
      setIsQuestionSelectorOpen(true);
      if (Array.isArray(location.state.selectedQuestionIds)) {
        setFormData((prev) => ({
          ...prev,
          selectedQuestionIds: location.state.selectedQuestionIds
        }));
      }
      if (location.state.selectedQuestionLevel) {
        setSelectedQuestionLevel(location.state.selectedQuestionLevel);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (!exams || exams.length === 0) {
      setNextExamNumber(1);
      setFormData((prev) => ({
        ...prev,
        examName: `Đề thi thử THPT Quốc Gia - Số 1`
      }));
      return;
    }

    const maxId = Math.max(...exams.map((exam) => exam.ExamID || 0));
    const nextId = maxId + 1;
    setNextExamNumber(nextId);
    setFormData((prev) => ({
      ...prev,
      examName: prev.mode === 'auto' ? `Đề thi thử THPT Quốc Gia - Số ${nextId}` : prev.examName || `Đề thi thử THPT Quốc Gia - Số ${nextId}`
    }));
  }, [exams]);

  const manualQuestions = bankQuestions.filter((q) => q.Level === formData.level);

  const toggleQuestionSelection = (questionId) => {
    setFormData((prev) => {
      const selectedQuestionIds = prev.selectedQuestionIds.includes(questionId)
        ? prev.selectedQuestionIds.filter((id) => id !== questionId)
        : [...prev.selectedQuestionIds, questionId];
      return { ...prev, selectedQuestionIds };
    });
  };

  const handleModeChange = (mode) => {
    setFormData((prev) => ({
      ...prev,
      mode,
      selectedQuestionIds: mode === 'manual' ? prev.selectedQuestionIds : [],
      examName: mode === 'auto' ? `Đề thi thử THPT Quốc Gia - Số ${nextExamNumber}` : prev.examName
    }));
  };

  // --- HÀM GỌI API TẠO ĐỀ MỚI ---
  const handleCreateExam = async () => {
      if (formData.mode === 'manual' && (!formData.selectedQuestionIds || formData.selectedQuestionIds.length === 0)) {
          alert('Vui lòng chọn ít nhất một bài để thêm vào đề thi thủ công.');
          return;
      }

      // Kiểm tra ràng buộc số lượng câu hỏi cho chế độ thủ công
      if (formData.mode === 'manual') {
          const { errors, warnings } = validateSelection(formData.selectedQuestionIds);

          if (errors.length > 0) {
              alert(`Không thể tạo đề thi!\n\nThiếu câu hỏi:\n${errors.join('\n')}`);
              return;
          }

          if (warnings.length > 0) {
              const proceed = window.confirm(`Cảnh báo:\n${warnings.join('\n')}\n\nBạn có muốn tiếp tục tạo đề không?`);
              if (!proceed) return;
          }
      }

      setIsCreating(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const selectedCount = formData.selectedQuestionIds.reduce((count, id) => {
          const question = bankQuestions.find((q) => q.QuestionID === id);
          return count + (question?.ChildCount || 0);
      }, 0);

      try {
          const payload = {
              examName: formData.examName,
              duration: formData.duration,
              level: formData.level,
              adminId: user?.UserID || 1,
              note: formData.note,
              selectedQuestionIds: formData.mode === 'manual' ? formData.selectedQuestionIds : [],
              totalQuestions: formData.mode === 'manual' ? selectedCount : 40
          };

          const data = await axiosClient.post('/exams/generate', payload);

          alert(`Tạo đề thành công! Đã trích xuất được ${data.totalInserted || selectedCount || 40} câu hỏi vào đề.`);
          setIsModalOpen(false);
          fetchExams(); // Load lại danh sách Card
      } catch(err) { 
          console.error(err);
          alert('Lỗi tạo đề thi! Kiểm tra lại kết nối hoặc Backend.');
      } finally {
          setIsCreating(false);
      }
  };

  const handleDeleteExam = async (examId) => {
      if (!window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) return;
      try {
          await axiosClient.delete(`/exams/${examId}`);
          fetchExams();
          alert('Xóa đề thi thành công');
      } catch (err) {
          console.error(err);
          alert('Xóa đề thi không thành công.');
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý đề thi</h2>
          <p className="text-gray-500 text-sm">Danh sách các bộ đề thi THPT Quốc gia</p>
        </div>
        {/* Nút này đã được gắn sự kiện mở Modal */}
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Tạo đề thi mới</span>
        </button>
      </div>

      {/* GIỮ NGUYÊN GIAO DIỆN GRID CỦA BẠN VÌ NÓ RẤT ĐẸP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <div key={exam.ExamID} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition bg-gray-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
               <button 
                  onClick={() => navigate(`/admin/exams/${exam.ExamID}`)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
               >
                <Eye size={16}/>
               </button>
               <button
                  type="button"
                  onClick={() => handleDeleteExam(exam.ExamID)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
               >
                <Trash2 size={16}/>
               </button>
            </div>
            
            <h3 className="font-bold text-lg text-indigo-900 mb-3 pr-20">{exam.ExamName}</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>Thời gian: {exam.Duration} phút</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen size={16} />
                <span>Số câu hỏi: {exam.TotalQuestions} câu</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Level: {exam.Level}</span>
                <span className="text-gray-400">Ngày tạo: {new Date(exam.CreatedAt).toLocaleDateString()} {new Date(exam.CreatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL TẠO ĐỀ THI --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div>
                          <h2 className="text-xl font-bold text-gray-800 mb-1">Tạo đề thi mới</h2>
                          <p className="text-sm text-gray-500">Chọn chế độ tạo đề tự động hoặc thủ công, và ghi chú đề thi nếu cần.</p>
                      </div>
                      <button
                          onClick={() => setIsModalOpen(false)}
                          className="text-gray-500 hover:text-gray-900"
                      >
                          Đóng
                      </button>
                  </div>

                  <div className="flex gap-3 mb-6">
                      <button
                          type="button"
                          onClick={() => handleModeChange('auto')}
                          className={`rounded-3xl px-5 py-2 text-sm font-semibold transition ${formData.mode === 'auto' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                          Tạo tự động
                      </button>
                      <button
                          type="button"
                          onClick={() => handleModeChange('manual')}
                          className={`rounded-3xl px-5 py-2 text-sm font-semibold transition ${formData.mode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                          Tạo thủ công
                      </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đề thi</label>
                              <input
                                  type="text"
                                  value={formData.examName}
                                  onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                              <textarea
                                  value={formData.note}
                                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                  rows={3}
                                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  placeholder="Ghi chú thêm cho đề thi"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ</label>
                                  <select
                                      value={formData.level}
                                      onChange={(e) => setFormData({ ...formData, level: e.target.value, selectedQuestionIds: formData.mode === 'manual' ? [] : formData.selectedQuestionIds })}
                                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  >
                                      <option value="Dễ">Dễ</option>
                                      <option value="Trung bình">Trung bình</option>
                                      <option value="Khó">Khó</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                                  <input
                                      type="number"
                                      min={10}
                                      value={formData.duration}
                                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                              </div>
                          </div>

                          <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-600">
                              <p className="font-semibold text-gray-800 mb-2">Chế độ hiện tại</p>
                              <p>{formData.mode === 'auto'
                                  ? 'Tạo đề thi tự động theo ma trận sẵn có.'
                                  : 'Tạo đề thi thủ công bằng cách chọn từng bài phù hợp mức độ.'}
                              </p>
                              {formData.mode === 'manual' && (
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    onClick={() => setIsQuestionSelectorOpen(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                                  >
                                    Bắt đầu tạo đề
                                  </button>
                                  <div className="mt-2 text-xs text-gray-500">
                                    Đã chọn: {formData.selectedQuestionIds.length} bài
                                  </div>
                                </div>
                              )}
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Số đề hiện tại</p>
                              <div className="text-xl font-bold text-indigo-800">Số {nextExamNumber}</div>
                          </div>
                          <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Tổng số câu (tạm)</p>
                              <div className="text-xl font-bold text-indigo-800">{formData.mode === 'manual' ? manualQuestions.filter(q => formData.selectedQuestionIds.includes(q.QuestionID)).reduce((sum, q) => sum + (q.ChildCount || 0), 0) : 40} câu</div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3">
                      <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="rounded-3xl border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100 transition"
                      >
                          Hủy
                      </button>
                      <button
                          type="button"
                          onClick={handleCreateExam}
                          disabled={isCreating}
                          className={`rounded-3xl px-6 py-3 text-white ${isCreating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                          {isCreating ? 'Đang tạo...' : formData.mode === 'auto' ? 'Tạo tự động' : 'Tạo thủ công'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Modal chọn bài cho chế độ thủ công */}
      {isQuestionSelectorOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-7xl shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Chọn bài cho đề thi</h2>
                <p className="text-sm text-gray-500">Chọn các bài phù hợp để tạo đề thi thủ công.</p>
              </div>
              <button
                onClick={() => setIsQuestionSelectorOpen(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                Đóng
              </button>
            </div>

            {/* Hiển thị tóm tắt số lượng câu hỏi đã chọn - LUÔN HIỆN VÀ CẬP NHẬT REALTIME */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Tóm tắt câu hỏi đã chọn:</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                {Object.keys(EXAM_REQUIREMENTS).map(type => {
                  const selectedOfType = bankQuestions.filter(q => formData.selectedQuestionIds.includes(q.QuestionID) && q.QuestionType === type);
                  // Ordering: đếm tổng số câu con, các loại khác: đếm số bài
                  const selected = type === 'Ordering'
                    ? selectedOfType.reduce((sum, q) => sum + (q.ChildCount || 0), 0)
                    : selectedOfType.length;
                  const { count: required, unit } = EXAM_REQUIREMENTS[type];
                  const isValid = selected >= required;
                  const isOver = selected > required;
                  return (
                    <div key={type} className={`p-2 rounded ${isValid ? (isOver ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800') : 'bg-red-100 text-red-800'}`}>
                      <div className="font-medium">{type}</div>
                      <div className="text-xs">{selected}/{required} {unit}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bộ lọc */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <input
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Tìm kiếm bài..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <select
                  value={selectedQuestionType}
                  onChange={(e) => setSelectedQuestionType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Tất cả loại</option>
                  <option value="Leaflet">Leaflet</option>
                  <option value="Ordering">Ordering</option>
                  <option value="Context_Filling">Context Filling</option>
                  <option value="Reading_8">Reading 8</option>
                  <option value="Reading_10">Reading 10</option>
                </select>
              </div>
              <div>
                <select
                  value={selectedQuestionLevel}
                  onChange={(e) => setSelectedQuestionLevel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Tất cả mức độ</option>
                  <option value="Dễ">Dễ</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Khó">Khó</option>
                </select>
              </div>
            </div>

            {/* Layout 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bên trái: Chọn bài */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Danh sách bài</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {manualQuestions
                    .filter(q =>
                      (!questionSearch || q.Prompt?.toLowerCase().includes(questionSearch.toLowerCase()) || q.Passage?.toLowerCase().includes(questionSearch.toLowerCase())) &&
                      (!selectedQuestionType || q.QuestionType === selectedQuestionType) &&
                      (!selectedQuestionLevel || q.Level === selectedQuestionLevel)
                    )
                    .map((question) => (
                      <div key={question.QuestionID} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-gray-800">{question.QuestionType}</span>
                              <span className="text-sm text-gray-500">{question.ChildCount || 0} câu</span>
                              <span className="text-sm text-gray-500">{question.Level}</span>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-blue-600 mb-1">📖 Đề bài:</div>
                              <div className="text-sm text-gray-700 line-clamp-2 bg-blue-50 p-2 rounded mb-2" dangerouslySetInnerHTML={{ __html: question.Prompt || 'Không có đề bài' }} />
                            </div>
                            {question.Passage && (
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-1">📝 Đoạn văn:</div>
                                <div className="text-sm text-gray-700 line-clamp-2 bg-gray-100 p-2 rounded" dangerouslySetInnerHTML={{ __html: question.Passage }} />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/questions/${question.QuestionID}`, {
                                state: {
                                  from: 'exam-selector',
                                  selectedQuestionIds: formData.selectedQuestionIds,
                                  selectedQuestionLevel: formData.level
                                }
                              })}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Xem chi tiết
                            </button>
                            <input
                              type="checkbox"
                              checked={formData.selectedQuestionIds.includes(question.QuestionID)}
                              onChange={() => toggleQuestionSelection(question.QuestionID)}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Bên phải: Preview đề thi - THÊM CÂUHỎI CON VÀ ĐÁP ÁN */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview đề thi</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {formData.selectedQuestionIds.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      Chưa chọn bài nào
                    </div>
                  ) : (
                    formData.selectedQuestionIds.map((questionId) => {
                      const question = bankQuestions.find(q => q.QuestionID === questionId);
                      return question ? (
                        <div key={questionId} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800">{question.QuestionType}</span>
                            <span className="text-sm text-gray-500">{question.ChildCount || 0} câu</span>
                            <span className="text-sm text-gray-500">{question.Level}</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-blue-600 mb-1">📖 Đề bài:</h4>
                            <div className="text-sm text-gray-700 bg-white p-2 rounded" dangerouslySetInnerHTML={{ __html: question.Prompt || 'Không có đề bài' }} />
                          </div>
                          {question.Passage && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-600 mb-1">📝 Đoạn văn:</h4>
                              <div className="text-sm text-gray-700 bg-white p-2 rounded line-clamp-3" dangerouslySetInnerHTML={{ __html: question.Passage }} />
                            </div>
                          )}
                          
                          {/* Hiển thị các câu hỏi con nếu có */}
                          {question.ChildQuestions && question.ChildQuestions.length > 0 && (
                            <div className="border-t pt-3">
                              <h4 className="text-xs font-semibold text-gray-700 mb-2">Câu hỏi con:</h4>
                              <div className="space-y-2">
                                {question.ChildQuestions.map((child, idx) => (
                                  <div key={child.QuestionID} className="bg-white p-2 rounded text-xs border border-gray-200">
                                    <div className="font-semibold text-gray-700 mb-1">Câu {idx + 1}: {child.Content || 'Không có nội dung'}</div>
                                    {child.Answers && child.Answers.length > 0 && (
                                      <div className="ml-3 space-y-0.5">
                                        {child.Answers.map((ans, aIdx) => (
                                          <div key={ans.AnswerID} className={`text-xs ${ans.IsCorrect === 1 ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                                            {String.fromCharCode(65 + aIdx)}. {ans.AnswerContent || 'Không có đáp án'} {ans.IsCorrect === 1 ? '✓' : ''}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            Tags: {(question.Tags || []).map(tag => tag.TagName).join(', ') || 'Không có'}
                          </div>
                        </div>
                      ) : null;
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Đã chọn: {formData.selectedQuestionIds.length} bài
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsQuestionSelectorOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setIsQuestionSelectorOpen(false)}
                  className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Xác nhận ({formData.selectedQuestionIds.length} bài)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManager;

import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Plus, Edit, Trash2, Clock, BookOpen } from 'lucide-react';

const ExamManager = () => {
  const [exams, setExams] = useState([]);
  
  // --- STATE MỚI CHO TÍNH NĂNG TẠO ĐỀ ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
      examName: 'Đề thi thử THPT Quốc Gia - Số 1',
      level: 'Trung bình',
      duration: 50 // Mặc định 50 phút
  });

  const fetchExams = async () => {
    try {
      const data = await axiosClient.get('/exams'); // Dùng axiosClient của bạn
      setExams(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách đề thi");
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // --- HÀM GỌI API TẠO ĐỀ MỚI ---
  const handleCreateExam = async () => {
      setIsCreating(true);
      const user = JSON.parse(localStorage.getItem('user'));
      
      try {
          // Dùng axiosClient.post thay vì fetch
          const data = await axiosClient.post('/exams/generate', {
              examName: formData.examName,
              duration: formData.duration,
              level: formData.level,
              adminId: user?.UserID || 1
          });
          
          alert(`Tạo đề thành công! Đã trích xuất được ${data.totalInserted || 40} câu hỏi vào đề.`);
          setIsModalOpen(false);
          fetchExams(); // Load lại danh sách Card
      } catch(err) { 
          console.error(err);
          alert('Lỗi tạo đề thi! Kiểm tra lại kết nối hoặc Backend.');
      } finally {
          setIsCreating(false);
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
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition">
               <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
               <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
            </div>
            
            <h3 className="font-bold text-lg text-indigo-900 mb-3 pr-8">{exam.ExamName}</h3>
            
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
                <span className="text-gray-400">Ngày tạo: {new Date(exam.CreatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL TẠO ĐỀ THI TỰ ĐỘNG --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl w-[400px] shadow-2xl animate-fade-in">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Tạo đề thi tự động</h2>
                  <p className="text-sm text-gray-500 mb-4">Hệ thống sẽ tự động nhặt các câu hỏi có sẵn trong ngân hàng để tạo thành đề.</p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tên đề thi</label>
                          <input 
                              type="text" 
                              value={formData.examName}
                              onChange={(e) => setFormData({...formData, examName: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ</label>
                              <select 
                                  value={formData.level}
                                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                  value={formData.duration}
                                  onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-3">
                      <button 
                          onClick={() => setIsModalOpen(false)} 
                          className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                          Hủy
                      </button>
                      <button 
                          onClick={handleCreateExam} 
                          disabled={isCreating}
                          className={`px-5 py-2 text-white rounded-lg font-medium transition-colors ${isCreating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                          {isCreating ? 'Đang tạo...' : 'Tạo ngay'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExamManager;
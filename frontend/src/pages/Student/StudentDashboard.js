import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, History, Award } from 'lucide-react'; // Đã xóa User ở đây

const StudentDashboard = () => {
  const navigate = useNavigate();
  const userData = localStorage.getItem('user');
  
  // Kiểm tra an toàn: Nếu không có user thì không render hoặc đẩy về Login
  const user = userData ? JSON.parse(userData) : null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Nếu lỡ vào trang này mà chưa có user, hiển thị Loading hoặc null để tránh lỗi
  if (!user) return <div className="p-10">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header cho Học sinh */}
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">TiengAnhTHPT</h1>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              {user.FullName ? user.FullName.charAt(0) : 'U'}
            </div>
            <span className="font-medium text-gray-700">{user.FullName}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition">
            Đăng xuất
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Chào mừng bạn trở lại! 👋</h2>
          <p className="text-gray-500 mt-2">Hôm nay bạn muốn luyện tập phần nào?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card: Vào ôn luyện */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Play fill="currentColor" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Vào ôn luyện</h3>
            <p className="text-gray-500 mt-2">Làm các đề thi thử bám sát ma trận 2025.</p>
            <button 
              className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
              onClick={() => navigate('/exams')}
            >
              Bắt đầu ngay
            </button>
          </div>

          {/* Card: Lịch sử thi */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group text-gray-400">
             <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <History size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Lịch sử làm bài</h3>
            <p className="text-gray-500 mt-2">Xem lại kết quả và các câu sai đã làm.</p>
            <button className="mt-6 w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
              Xem chi tiết
            </button>
          </div>
        </div>

        {/* Section: Điểm số cao */}
        <div className="mt-12 bg-indigo-900 rounded-3xl p-8 text-white flex items-center justify-between overflow-hidden relative">
            <div className="z-10">
                <h3 className="text-xl font-bold">Thành tích mục tiêu</h3>
                <p className="text-indigo-200 mt-1 italic">Hãy cố gắng đạt 9+ Tiếng Anh nhé!</p>
            </div>
            <Award size={80} className="text-white/10 absolute -right-4 -bottom-4 transform rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
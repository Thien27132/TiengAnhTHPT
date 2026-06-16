import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { FileText, LayoutGrid, LogOut, User, BookOpen } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl">
        <div className="p-6 text-center border-b border-indigo-800">
          <h1 className="text-xl font-bold tracking-tighter">TiengAnhTHPT Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/questions" className="flex items-center space-x-3 p-3 hover:bg-indigo-800 rounded-lg transition">
            <FileText size={20} />
            <span>Quản lý câu hỏi</span>
          </Link>
          <Link to="/admin/exams" className="flex items-center space-x-3 p-3 hover:bg-indigo-800 rounded-lg transition">
            <LayoutGrid size={20} />
            <span>Quản lý đề thi</span>
          </Link>
          <Link to="/admin/resources" className="flex items-center space-x-3 p-3 hover:bg-indigo-800 rounded-lg transition">
            <BookOpen size={20} />
            <span>Kho tài liệu</span>
          </Link>
        </nav>
        <div className="p-4 bg-indigo-950 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User size={16} />
            <span className="text-xs truncate w-24">{user?.FullName}</span>
          </div>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet /> {/* Nơi QuestionManager, ExamManager, ExamDetail hiển thị */}
      </main>
    </div>
  );
};

export default AdminLayout;
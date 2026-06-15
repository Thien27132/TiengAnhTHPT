import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { ArrowLeft, Eye, Award, Search } from 'lucide-react';

const ExamHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [examResults, setExamResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchExamHistory = async () => {
      try {
        setIsLoading(true);
        if (!user?.UserID) {
          alert('Bạn cần đăng nhập lại');
          navigate('/login');
          return;
        }
        const data = await axiosClient.get(`/exams/student/${user.UserID}/results`);
        setExamResults(data || []);
      } catch (error) {
        console.error('Lỗi tải lịch sử thi:', error);
        alert('Không thể tải lịch sử thi. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamHistory();
  }, [user?.UserID, navigate]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} phút ${secs} giây`;
  };

  const filteredResults = useMemo(() => {
    return examResults.filter((result) => {
      const matchesKeyword = result.ExamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.Level?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = selectedLevel ? result.Level === selectedLevel : true;
      return matchesKeyword && matchesLevel;
    });
  }, [examResults, searchTerm, selectedLevel]);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 hover:text-indigo-700 transition flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="text-2xl font-bold text-indigo-600">Lịch sử thi</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end w-full md:w-auto">
          <div className="relative w-full sm:w-[260px]">
            <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-10 pr-4 outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:w-auto"
          >
            <option value="">Tất cả mức độ</option>
            <option value="Dễ">Dễ</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Khó">Khó</option>
          </select>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-gray-600">Đang tải lịch sử thi...</span>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <Award size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">Không tìm thấy lịch sử thi phù hợp.</p>
            <button
              onClick={() => navigate('/exams')}
              className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
            >
              Bắt đầu làm bài thi ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <div
                key={result.ResultID}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{result.ExamName}</h3>
                    <p className="text-sm text-gray-500">
                      <span className="block">Nộp bài: {formatDateTime(result.CompletedAt)}</span>
                      <span className="block">Thời gian làm bài: {formatTime(result.CompletedTime || 0)}</span>
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-xs text-blue-600 font-medium">Mức độ</p>
                    <p className="text-lg font-bold text-blue-900">{result.Level}</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <p className="text-xs text-green-600 font-medium">Điểm số</p>
                    <p className="text-3xl font-bold text-green-900">{Number(result.Score).toFixed(1)}/10</p>
                  </div>

                  <button
                    onClick={() => navigate(`/exam-result/${result.ResultID}`)}
                    className="md:col-span-1 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 h-full"
                  >
                    <Eye size={18} />
                    <span>Xem chi tiết</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamHistory;

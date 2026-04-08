import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { ArrowLeft, Eye, Award } from 'lucide-react';

const ExamHistory = () => {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center space-x-4 sticky top-0 z-10 shadow-sm">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-indigo-600 hover:text-indigo-700 transition flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1 className="text-2xl font-bold text-indigo-600">Lịch sử thi</h1>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-gray-600">Đang tải lịch sử thi...</span>
            </div>
          </div>
        ) : examResults.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <Award size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">Bạn chưa làm bài thi nào cả</p>
            <button
              onClick={() => navigate('/exams')}
              className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
            >
              Bắt đầu làm bài thi ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {examResults.map((result) => (
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

import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { X, Check, AlertCircle, BookOpen } from 'lucide-react';

const IncorrectAnswersReview = ({ resultId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'byTag'
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    const fetchIncorrectAnswers = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/analysis/incorrect-answers', {
          params: { resultId }
        });
        console.log('API Response:', response);
        // axiosClient trả về data trực tiếp (không phải {data: ...})
        setData(response);
      } catch (err) {
        console.error('Lỗi gọi API:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách câu sai');
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchIncorrectAnswers();
    }
  }, [resultId]);

  const toggleExpand = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách câu sai...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  if (!data || !data.examInfo) {
    return (
      <div className="text-center p-8 text-gray-500">
        Không có dữ liệu
      </div>
    );
  }

  const { examInfo, incorrectAnswers, groupedByTag } = data;
  const totalQuestions = examInfo.totalIncorrectAnswers;

  return (
    <div className="space-y-6">
      {/* Header thông tin bài thi */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Bài thi</p>
            <p className="text-xl font-bold text-gray-800">{examInfo.examName}</p>
            <p className="text-xs text-gray-500 mt-1">Mức độ: {examInfo.level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tổng câu sai</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-red-600">{totalQuestions}</p>
              <p className="text-gray-600">câu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          📋 Danh sách câu sai ({totalQuestions})
        </button>
        <button
          onClick={() => setActiveTab('byTag')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'byTag'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          🏷️ Phân loại theo Tag ({Object.keys(groupedByTag).length})
        </button>
      </div>

      {/* Tab Content - Danh sách câu sai */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {incorrectAnswers.length === 0 ? (
            <div className="text-center py-8 text-green-600">
              ✅ Tuyệt vời! Bạn trả lời hết tất cả câu hỏi
            </div>
          ) : (
            incorrectAnswers.map((item) => (
              <div
                key={item.detailId}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                {/* Question header */}
                <button
                  onClick={() => toggleExpand(item.questionId)}
                  className="w-full p-4 flex items-start gap-4 hover:bg-gray-50 transition text-left"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <X size={18} className="text-red-600" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          Câu {item.displayOrder}
                        </p>
                        <p
                          className="text-sm text-gray-600 mt-1 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: item.questionContent }}
                        />
                      </div>
                      <span className={`flex-shrink-0 ml-2 px-2 py-1 text-xs rounded ${
                        expandedQuestions[item.questionId]
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {expandedQuestions[item.questionId] ? '▼' : '▶'}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium"
                        >
                          🏷️ {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {expandedQuestions[item.questionId] && (
                  <div className="px-4 pb-4 pt-2 border-t bg-gray-50 space-y-3">
                    {/* Student answer */}
                    <div className="bg-white rounded p-3 border-l-4 border-red-400">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        ❌ Bạn trả lời
                      </p>
                      <p className="text-sm text-gray-800">
                        {item.studentAnswer}
                      </p>
                    </div>

                    {/* Correct answer */}
                    <div className="bg-white rounded p-3 border-l-4 border-green-400">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        ✅ Đáp án đúng
                      </p>
                      <p className="text-sm text-gray-800">
                        {item.correctAnswer}
                      </p>
                    </div>

                    {/* Explanation */}
                    {item.explanation && (
                      <div className="bg-white rounded p-3 border-l-4 border-yellow-400">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                          💡 Giải thích
                        </p>
                        <p
                          className="text-sm text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: item.explanation }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content - Phân loại theo Tag */}
      {activeTab === 'byTag' && (
        <div className="space-y-4">
          {Object.entries(groupedByTag).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu phân loại
            </div>
          ) : (
            Object.entries(groupedByTag)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([tagName, questions]) => (
                <div key={tagName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Tag header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen size={20} className="text-indigo-600" />
                        <div>
                          <p className="font-semibold text-gray-800">{tagName}</p>
                          <p className="text-sm text-gray-600">{questions.length} câu sai</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-red-500">{questions.length}</div>
                    </div>
                  </div>

                  {/* Questions list */}
                  <div className="divide-y">
                    {questions.map((item) => (
                      <div key={item.detailId} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-600 text-sm font-medium">
                            {item.displayOrder}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium text-gray-800"
                              dangerouslySetInnerHTML={{ __html: item.questionContent }}
                            />
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-600">
                                <span className="font-semibold">Bạn trả lời:</span> {item.studentAnswer}
                              </p>
                              <p className="text-xs text-green-700">
                                <span className="font-semibold">Đáp án đúng:</span> {item.correctAnswer}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Footer - Tóm tắt */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <p className="text-sm text-indigo-900">
          <span className="font-semibold">💡 Gợi ý:</span> Tập trung ôn tập các chủ đề có nhiều câu sai. 
          Xem phần "Phân loại theo Tag" để xác định điểm yếu.
        </p>
      </div>
    </div>
  );
};

export default IncorrectAnswersReview;

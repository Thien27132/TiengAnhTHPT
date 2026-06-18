import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { X, Check, AlertCircle, BookOpen, FileText, ExternalLink } from 'lucide-react';

// Helper: strip HTML tags và decode HTML entities
const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Base URL cho backend (bỏ /api nếu có, vì documents serve ở root)
const BACKEND_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

// Helper: Lấy thông tin gợi ý dựa trên số câu sai
const getRecommendationLevel = (wrongCount) => {
  if (wrongCount > 2) {
    return {
      label: '⚠️ Phải ôn tập ngay',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      badgeBg: 'bg-red-100 text-red-700',
      btnBg: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    };
  } else if (wrongCount === 2) {
    return {
      label: '📝 Nên ôn tập',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      badgeBg: 'bg-yellow-100 text-yellow-700',
      btnBg: 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600',
    };
  } else {
    return {
      label: '💡 Có thể ôn tập',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      badgeBg: 'bg-green-100 text-green-700',
      btnBg: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    };
  }
};

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
        setError(err.response?.data?.message || 'Không thể tải danh sách câu sai/chưa chọn');
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

  // Mở tài liệu PDF trong tab mới
  const openDocument = (documentUrl) => {
    if (documentUrl) {
      window.open(`${BACKEND_URL}${documentUrl}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách câu sai/chưa chọn...</p>
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
            <p className="text-sm text-gray-600">Tổng câu sai/chưa chọn</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-red-600">{totalQuestions}</p>
              <p className="text-gray-600">câu</p>
            </div>
            {examInfo.totalUnanswered > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                ({examInfo.totalWrong || 0} sai, {examInfo.totalUnanswered} chưa chọn)
              </p>
            )}
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
          📋 Danh sách câu sai/chưa chọn ({totalQuestions})
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
              ✅ Tuyệt vời! Bạn trả lời đúng hết tất cả câu hỏi
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.isUnanswered ? 'bg-yellow-100' : 'bg-red-100'}`}>
                      {item.isUnanswered 
                        ? <AlertCircle size={18} className="text-yellow-600" />
                        : <X size={18} className="text-red-600" />
                      }
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
                          🏷️ {typeof tag === 'object' ? tag.name : tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {expandedQuestions[item.questionId] && (
                  <div className="px-4 pb-4 pt-2 border-t bg-gray-50 space-y-3">
                    {/* Student answer */}
                    <div className={`bg-white rounded p-3 border-l-4 ${item.isUnanswered ? 'border-yellow-400' : 'border-red-400'}`}>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        {item.isUnanswered ? '⚠️ Chưa chọn đáp án' : '❌ Bạn trả lời'}
                      </p>
                      <p className={`text-sm ${item.isUnanswered ? 'text-yellow-700 italic' : 'text-gray-800'}`}>
                        {item.isUnanswered ? 'Bạn chưa chọn đáp án cho câu này' : stripHtml(item.studentAnswer)}
                      </p>
                    </div>

                    {/* Correct answer */}
                    <div className="bg-white rounded p-3 border-l-4 border-green-400">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        ✅ Đáp án đúng
                      </p>
                      <p className="text-sm text-gray-800">
                        {stripHtml(item.correctAnswer)}
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

      {/* Tab Content - Phân loại theo Tag + Gợi ý tài liệu */}
      {activeTab === 'byTag' && (
        <div className="space-y-4">
          {Object.entries(groupedByTag).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu phân loại
            </div>
          ) : (
            Object.entries(groupedByTag)
              .sort(([, a], [, b]) => {
                const aLen = a.questions ? a.questions.length : (Array.isArray(a) ? a.length : 0);
                const bLen = b.questions ? b.questions.length : (Array.isArray(b) ? b.length : 0);
                return bLen - aLen;
              })
              .map(([tagName, tagData]) => {
                // Tương thích cả format cũ (array) và mới (object với questions)
                const questions = tagData.questions || (Array.isArray(tagData) ? tagData : []);
                const documentUrl = tagData.documentUrl || null;
                const documentTitle = tagData.documentTitle || null;
                const wrongCount = questions.length;
                const recommendation = getRecommendationLevel(wrongCount);

                return (
                  <div key={tagName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Tag header */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen size={20} className="text-indigo-600" />
                          <div>
                            <p className="font-semibold text-gray-800">{tagName}</p>
                            <p className="text-sm text-gray-600">{wrongCount} câu sai/chưa chọn</p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-500">{wrongCount}</div>
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
                                  <span className="font-semibold">Bạn trả lời:</span>{' '}
                                  {item.isUnanswered 
                                    ? <span className="text-yellow-600 italic">Chưa chọn</span>
                                    : stripHtml(item.studentAnswer)
                                  }
                                </p>
                                <p className="text-xs text-green-700">
                                  <span className="font-semibold">Đáp án đúng:</span> {stripHtml(item.correctAnswer)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Gợi ý tài liệu ôn tập — nằm cuối mỗi nhóm tag */}
                    {documentUrl && (
                      <div className={`p-4 border-t ${recommendation.bgColor} ${recommendation.borderColor}`}>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className={recommendation.color} />
                            <div>
                              <span className={`text-sm font-bold ${recommendation.color}`}>
                                {recommendation.label}
                              </span>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {documentTitle || `Tài liệu ôn tập: ${tagName}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => openDocument(documentUrl)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 ${recommendation.btnBg} text-white rounded-lg text-sm font-medium transition shadow-sm`}
                          >
                            <FileText size={14} />
                            Xem tài liệu
                            <ExternalLink size={12} className="opacity-75" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Footer - Tóm tắt */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <p className="text-sm text-indigo-900">
          <span className="font-semibold">💡 Gợi ý:</span> Tập trung ôn tập các chủ đề có nhiều câu sai/chưa chọn. 
          Xem phần "Phân loại theo Tag" để xác định điểm yếu và truy cập tài liệu ôn tập tương ứng.
        </p>
      </div>
    </div>
  );
};

export default IncorrectAnswersReview;

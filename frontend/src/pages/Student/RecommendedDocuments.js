import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { FileText, ExternalLink, AlertTriangle, BookOpen, TrendingDown } from 'lucide-react';

// Base URL cho backend
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const RecommendedDocuments = ({ studentId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentErrors, setDocumentErrors] = useState({}); // Track broken document links

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/resources/recommended', {
          params: { studentId, limit: 10 }
        });
        setDocuments(response || []);
      } catch (err) {
        console.error('Lỗi tải tài liệu gợi ý:', err);
        setError('Không thể tải tài liệu gợi ý');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchRecommendations();
    }
  }, [studentId]);

  const openDocument = async (documentUrl, tagId) => {
    if (!documentUrl) return;
    const fullUrl = `${BACKEND_URL}${documentUrl}`;
    try {
      const response = await fetch(fullUrl, { method: 'HEAD' });
      if (response.ok) {
        window.open(fullUrl, '_blank');
        // Xóa lỗi cũ nếu có
        if (tagId && documentErrors[tagId]) {
          setDocumentErrors(prev => {
            const next = { ...prev };
            delete next[tagId];
            return next;
          });
        }
      } else {
        if (tagId) {
          setDocumentErrors(prev => ({ ...prev, [tagId]: true }));
        }
      }
    } catch (err) {
      if (tagId) {
        setDocumentErrors(prev => ({ ...prev, [tagId]: true }));
      }
    }
  };

  // Lấy màu sắc theo mức độ ưu tiên
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-100 text-red-700',
          icon: 'text-red-500',
          bar: 'bg-red-500'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
          icon: 'text-amber-500',
          bar: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-700',
          icon: 'text-green-500',
          bar: 'bg-green-500'
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-purple-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Tài liệu gợi ý cho bạn</h2>
        </div>
        <div className="text-center py-8 text-slate-500">Đang tải tài liệu gợi ý...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-purple-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Tài liệu gợi ý cho bạn</h2>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-rose-700">{error}</div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-purple-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Tài liệu gợi ý cho bạn</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg font-medium text-green-600">Tuyệt vời! Bạn không có điểm yếu nào cần ôn tập.</p>
          <p className="text-sm text-gray-500 mt-2">Hãy tiếp tục làm bài để hệ thống phân tích thêm nhé!</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-12">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:items-center md:flex-row md:justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tài liệu gợi ý cho bạn</h2>
              <p className="text-gray-500 mt-1">
                Dựa trên {documents.length} chủ đề bạn hay sai nhất
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              {'> 60% sai'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
              30-60% sai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              {'< 30% sai'}
            </span>
          </div>
        </div>

        {/* Document cards */}
        <div className="space-y-3">
          {documents.map((doc, index) => {
            const styles = getPriorityStyles(doc.priority);

            return (
              <div
                key={doc.tagId || index}
                className={`${styles.bg} border ${styles.border} rounded-2xl p-4 transition hover:shadow-md`}
              >
                <div className="flex items-center gap-4">
                  {/* Priority indicator */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.badge}`}>
                      <TrendingDown size={20} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">{doc.tagName}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${styles.badge}`}>
                        {doc.priorityLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Sai <strong className="text-red-600">{doc.totalWrong}</strong>/{doc.totalQuestions} câu</span>
                      <span>•</span>
                      <span>Tỷ lệ sai: <strong className={styles.icon}>{doc.errorRate}%</strong></span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${styles.bar} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${doc.errorRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex-shrink-0 flex gap-2">
                    {doc.documentUrl ? (
                      documentErrors[doc.tagId] ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-amber-700">Tài liệu đang được hệ thống cập nhật.</p>
                            <p className="text-xs text-amber-600">Vui lòng quay lại sau!</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openDocument(doc.documentUrl, doc.tagId)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-indigo-700 transition shadow-sm"
                        >
                          <FileText size={14} />
                          Xem tài liệu
                          <ExternalLink size={12} className="opacity-75" />
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 italic px-3 py-2">Chưa có tài liệu</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
          <p className="text-sm text-purple-800">
            <span className="font-semibold">💡 Mẹo:</span> Tập trung ôn tập từ chủ đề có tỷ lệ sai cao nhất. 
            Hãy đọc tài liệu rồi làm lại bài thi để kiểm tra tiến bộ!
          </p>
        </div>
      </div>
    </section>
  );
};

export default RecommendedDocuments;

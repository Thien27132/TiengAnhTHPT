import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFromExamSelector = location.state?.from === 'exam-selector';

  const handleBack = () => {
    if (isFromExamSelector) {
      navigate('/admin/exams', {
        state: {
          openQuestionSelector: true,
          selectedQuestionIds: location.state?.selectedQuestionIds || [],
          selectedQuestionLevel: location.state?.selectedQuestionLevel || 'Trung bình'
        }
      });
    } else {
      navigate('/admin/questions');
    }
  };

  useEffect(() => {
    const fetchQuestionDetail = async () => {
      try {
        setLoading(true);
        const data = await axiosClient.get(`/questions/${id}`);
        setQuestion(data);
      } catch (err) {
        console.error('Lỗi lấy chi tiết câu hỏi', err);
        setError('Không thể tải chi tiết câu hỏi. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestionDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải chi tiết câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy câu hỏi'}</p>
          <button
            onClick={handleBack}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            {isFromExamSelector ? 'Quay lại chọn bài' : 'Quay lại danh sách'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-2"
          >
            ← {isFromExamSelector ? 'Quay lại chọn bài' : 'Quay lại danh sách'}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết câu hỏi</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Đề bài */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Đề bài</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: question.prompt || question.rawContent || 'Không có đề bài' }} />
            </div>
          </div>

          {/* Đoạn văn */}
          {question.passage && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Đoạn văn</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: question.passage }} />
              </div>
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Loại đề</div>
              <div className="text-lg font-semibold text-blue-900">{question.questionType}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Mức độ</div>
              <div className="text-lg font-semibold text-green-900">{question.level}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Số câu hỏi</div>
              <div className="text-lg font-semibold text-purple-900">{question.questions?.length || 0}</div>
            </div>
          </div>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag) => (
                  <span key={tag.TagID} className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                    {tag.TagName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Các câu hỏi */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Các câu hỏi</h2>
            <div className="space-y-6">
              {question.questions?.map((item, idx) => (
                <div key={item.questionId || idx} className="border border-gray-200 rounded-lg p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Câu {idx + 1}</h3>
                    <span className="text-sm text-gray-500">Loại: {question.questionType}</span>
                  </div>

                  {(item.questionContent || item.rawQuestionContent) && (
                    <div className="mb-4">
                      <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: item.questionContent || item.rawQuestionContent || '' }} />
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">Đáp án:</h4>
                    {item.answers?.map((ans, ansIdx) => (
                      <div
                        key={ans.AnswerID || ansIdx}
                        className={`rounded-lg border p-4 ${
                          ans.IsCorrect === 1 || ans.isCorrect
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">
                            {String.fromCharCode(65 + ansIdx)}.
                          </span>
                          {ans.IsCorrect === 1 || ans.isCorrect ? (
                            <span className="text-green-700 font-semibold">✓ Đáp án đúng</span>
                          ) : null}
                        </div>
                        <div className="mt-2 text-gray-700" dangerouslySetInnerHTML={{ __html: ans.AnswerContent || ans.content || '' }} />
                        {(ans.Explanation || ans.explanation) && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-300">
                            <div className="text-sm font-medium text-blue-800">Giải thích:</div>
                            <div className="mt-1 text-sm text-blue-700" dangerouslySetInnerHTML={{ __html: ans.Explanation || ans.explanation }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;
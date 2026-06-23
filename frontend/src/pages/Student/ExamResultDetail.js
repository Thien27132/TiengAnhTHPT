import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { ArrowLeft, Check, X, AlertCircle, Award } from 'lucide-react';
import IncorrectAnswersReview from './IncorrectAnswersReview';

// Helper function to parse Content from JSON format
const parseContent = (content) => {
  if (!content) return { prompt: '', passage: '' };
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && ('prompt' in parsed || 'passage' in parsed)) {
      return parsed;
    }
  } catch (error) {
    return { prompt: content, passage: '' };
  }
  return { prompt: content, passage: '' };
};

const replaceBlanksWithNumbers = (text, childQuestions) => {
  if (!text) return text;
  let index = 0;
  return text.replace(/\[BLANK\]/g, () => {
    const child = childQuestions[index++];
    const number = child?.displayNumber != null ? child.displayNumber : '?';
    return `<span class="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 mx-1 rounded shadow-sm">(${number})</span>`;
  });
};

const buildDisplayNumberMap = (questions) => {
  const map = {};
  let current = 0;
  questions.forEach((item) => {
    if (item.type === 'question') {
      current += 1;
      map[item.data.QuestionID] = current;
    }
  });
  return map;
};

const isQuestionCorrect = (question) => {
  const selectedAnswerId = question?.data?.studentAnswer?.SelectedAnswerID;
  if (!selectedAnswerId || !question?.data?.answers) return false;
  return question.data.answers.some(
    (answer) => String(answer.AnswerID) === String(selectedAnswerId) && Number(answer.IsCorrect) === 1
  );
};

const isQuestionUnanswered = (question) => {
  const selectedAnswerId = question?.data?.studentAnswer?.SelectedAnswerID;
  return !selectedAnswerId;
};

const ExamResultDetail = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'detailed'

  useEffect(() => {
    const fetchResultDetail = async () => {
      try {
        setIsLoading(true);
        const data = await axiosClient.get(`/exams/result/${resultId}`);
        console.log('Result data:', data);
        console.log('Questions data:', data.questions);
        setResult(data);
      } catch (error) {
        console.error('Lỗi tải chi tiết kết quả:', error);
        alert('Không thể tải chi tiết kết quả');
        navigate('/exam-history');
      } finally {
        setIsLoading(false);
      }
    };

    if (resultId) {
      fetchResultDetail();
    }
  }, [resultId, navigate]);

  // Tính toán isPerfectScore từ result
  const totalQuestionsForCheck = result ? (result.questions || []).filter(q => q.type === 'question').length : 0;
  const correctCountForCheck = result?.examResults?.[0]?.Score ? Math.round((result.examResults[0].Score / 10) * totalQuestionsForCheck) : 0;
  const isPerfectScore = totalQuestionsForCheck > 0 && correctCountForCheck === totalQuestionsForCheck;

  // Tự động chuyển sang tab 'detailed' khi điểm tuyệt đối
  useEffect(() => {
    if (isPerfectScore) {
      setActiveTab('detailed');
    }
  }, [isPerfectScore]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Đang tải chi tiết kết quả...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <button
          onClick={() => navigate('/exam-history')}
          className="text-indigo-600 hover:text-indigo-700 transition flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <div className="bg-white rounded-3xl p-12 text-center">
          <p className="text-lg text-gray-500">Không tìm thấy kết quả</p>
        </div>
      </div>
    );
  }

  const { examInfo, questions = [] } = result;
  const totalQuestions = questions.filter(q => q.type === 'question').length || 0;
  const unansweredCount = questions.filter(q => q.type === 'question' && isQuestionUnanswered(q)).length;
  const correctCount = result.examResults?.[0]?.Score ? Math.round((result.examResults[0].Score / 10) * totalQuestions) : 0;
  const wrongCount = totalQuestions - correctCount - unansweredCount;
  const displayNumberMap = buildDisplayNumberMap(questions);

  const renderAnswerOptions = (question) => {
    if (!question.data || !question.data.answers) {
      console.warn('No answers for question:', question);
      return null;
    }

    const studentAnswerId = question.data.studentAnswer?.SelectedAnswerID;
    const correctAnswer = question.data.answers.find(a => Number(a.IsCorrect) === 1);

    return (
      <>
        <div className="space-y-3 mb-4">
          {question.data.answers.map((answer, idx) => {
            const isStudentChoice = String(answer.AnswerID) === String(studentAnswerId);
            const isCorrect = Number(answer.IsCorrect) === 1;

            // Determine styling based on correctness
            let borderClass = 'border-gray-200 bg-white';
            let circleClass = 'bg-gray-200 text-gray-700';
            let icon = null;
            let label = '';

            if (isStudentChoice && isCorrect) {
              // Student chose the correct answer
              borderClass = 'border-green-500 bg-green-50';
              circleClass = 'bg-green-500 text-white';
              icon = <Check size={14} />;
              label = 'Đáp án đúng - Bạn chọn';
            } else if (isStudentChoice && !isCorrect) {
              // Student chose an incorrect answer
              borderClass = 'border-red-500 bg-red-50';
              circleClass = 'bg-red-500 text-white';
              icon = <X size={14} />;
              label = 'Bạn chọn sai';
            } else if (!isStudentChoice && isCorrect) {
              // This is the correct answer (but student didn't choose it)
              borderClass = 'border-green-500 bg-green-50';
              circleClass = 'bg-green-500 text-white';
              icon = <Check size={14} />;
              label = 'Đáp án đúng';
            }

            return (
              <div
                key={answer.AnswerID}
                className={`rounded-lg border-2 p-4 transition ${borderClass}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${circleClass}`}>
                    {icon || String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: answer.AnswerContent }} />
                    {label && (
                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
                        <span className={label.includes('sai') ? 'text-red-700' : 'text-green-700'}>
                          {label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation - Always show if exists */}
        {correctAnswer?.Explanation && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
            <div className="text-xs font-semibold text-blue-700 uppercase mb-2">💡 Lời giải thích</div>
            <div
              className="text-blue-900 text-sm"
              dangerouslySetInnerHTML={{ __html: correctAnswer.Explanation || '' }}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-8 py-4 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate('/exam-history')}
          className="text-indigo-600 hover:text-indigo-700 transition flex items-center gap-2 mb-4"
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{examInfo?.ExamName}</h1>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        {/* Score Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
            <div className="text-xs text-indigo-600 font-semibold uppercase mb-2">Điểm thi</div>
            <div className="text-4xl font-bold text-indigo-900">{Number(result.examResults[0]?.Score || 0).toFixed(2)}</div>
            <div className="text-sm text-indigo-700 mt-2">/10 điểm</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="text-xs text-green-600 font-semibold uppercase mb-2">Đúng</div>
            <div className="text-4xl font-bold text-green-900">{correctCount}</div>
            <div className="text-sm text-green-700 mt-2">/{totalQuestions} câu</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <div className="text-xs text-orange-600 font-semibold uppercase mb-2">Sai</div>
            <div className="text-4xl font-bold text-orange-900">{wrongCount}</div>
            <div className="text-sm text-orange-700 mt-2">câu</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
            <div className="text-xs text-yellow-600 font-semibold uppercase mb-2">Chưa chọn</div>
            <div className="text-4xl font-bold text-yellow-900">{unansweredCount}</div>
            <div className="text-sm text-yellow-700 mt-2">câu</div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="text-xs text-gray-600 font-semibold uppercase mb-2">Tỉ lệ</div>
            <div className="text-4xl font-bold text-gray-900">{totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(0) : 0}%</div>
            <div className="text-sm text-gray-700 mt-2">hoàn thành</div>
          </div>
        </div>

        {/* Thông báo điểm tuyệt đối */}
        {isPerfectScore && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-8 border-2 border-green-300 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-green-200/40 to-transparent rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-200/30 to-transparent rounded-tr-full"></div>
            <div className="relative flex items-center gap-5">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Award size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800 mb-1">🎉 Xuất sắc! Điểm tuyệt đối!</h3>
                <p className="text-green-700 text-base">Chúc mừng bạn đã nắm vững toàn bộ kiến thức của bài thi này!</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b mb-8 sticky top-20 bg-slate-50 z-20 -mx-8 px-8 py-2">
          {!isPerfectScore && (
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-3 font-medium border-b-2 transition ${activeTab === 'review'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              🎯 Tổng hợp câu sai/chưa chọn
            </button>
          )}
          <button
            onClick={() => setActiveTab('detailed')}
            className={`px-4 py-3 font-medium border-b-2 transition ${(activeTab === 'detailed' || isPerfectScore)
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
          >
            📝 Xem lại bài thi
          </button>
        </div>

        {/* Tab Content - Danh sách câu sai kèm Tag (ẩn khi điểm tuyệt đối) */}
        {activeTab === 'review' && !isPerfectScore && (
          <div className="mb-8">
            <IncorrectAnswersReview resultId={resultId} />
          </div>
        )}

        {/* Tab Content - Chi tiết các câu hỏi */}
        {activeTab === 'detailed' && (
          <div className="space-y-8">
            {(() => {
              let questionNumber = 0;
              return questions.map((item, passageIndex) => {
                if (item.type === 'passage') {
                  // Parse passage content
                  const parsedContent = parseContent(item.data.Content);
                  const childQuestions = questions
                    .filter(questionItem => questionItem.type === 'question' && questionItem.data.ParentID === item.data.QuestionID)
                    .map(q => ({ displayNumber: displayNumberMap[q.data.QuestionID] }));

                  const promptHtml = replaceBlanksWithNumbers(parsedContent.prompt || item.data.Content || '', childQuestions);
                  const passageHtml = parsedContent.passage && parsedContent.passage.trim()
                    ? replaceBlanksWithNumbers(parsedContent.passage, childQuestions)
                    : null;

                  // Render passage with its child questions
                  return (
                    <div key={`passage-${passageIndex}`}>
                      {/* Passage Content */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                          <h3 className="text-sm font-semibold text-blue-800 mb-2">📖 Đề bài</h3>
                          <div
                            className="text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: promptHtml }}
                          />
                        </div>

                        {/* Passage text */}
                        {passageHtml && (
                          <div className="p-4 mt-4 bg-gray-50 border-l-4 border-gray-400 rounded">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 Đoạn văn</h3>
                            <div
                              className="text-gray-800 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: passageHtml }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Find and render child questions for this passage */}
                      {questions.map((questionItem, qIndex) => {
                        if (questionItem.type === 'question' && questionItem.data.ParentID === item.data.QuestionID) {
                          questionNumber++;
                          const isCorrect = isQuestionCorrect(questionItem);
                          const unanswered = isQuestionUnanswered(questionItem);

                          return (
                            <div
                              key={`question-${questionItem.data.QuestionID}`}
                              className={`rounded-2xl border-2 p-6 mb-6 ${isCorrect
                                ? 'bg-green-50 border-green-500'
                                : unanswered
                                  ? 'bg-yellow-50 border-yellow-500'
                                  : 'bg-red-50 border-red-500'
                                }`}
                            >
                              {/* Question Header */}
                              <div className="flex items-start gap-4 mb-6">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isCorrect ? 'bg-green-500' : unanswered ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}>
                                  {isCorrect ? <Check size={20} /> : unanswered ? <AlertCircle size={20} /> : <X size={20} />}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-2">
                                    Câu {questionNumber}
                                  </h3>
                                  <div
                                    className="text-gray-800 font-medium"
                                    dangerouslySetInnerHTML={{ __html: questionItem.data.Content || 'Không có nội dung' }}
                                  />
                                </div>
                              </div>

                              {/* Answer Options & Explanation */}
                              <div className="ml-14 mb-4">
                                <div className="text-sm font-semibold text-gray-600 mb-3">Các đáp án:</div>
                                {renderAnswerOptions(questionItem)}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                }

                // Render standalone questions (no parent)
                if (item.type === 'question' && !item.data.ParentID) {
                  questionNumber++;
                  const isCorrect = isQuestionCorrect(item);
                  const unanswered = isQuestionUnanswered(item);

                  return (
                    <div
                      key={`question-${item.data.QuestionID}`}
                      className={`rounded-2xl border-2 p-6 ${isCorrect
                        ? 'bg-green-50 border-green-500'
                        : unanswered
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-red-50 border-red-500'
                        }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isCorrect ? 'bg-green-500' : unanswered ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                          {isCorrect ? <Check size={20} /> : unanswered ? <AlertCircle size={20} /> : <X size={20} />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Câu {questionNumber}
                          </h3>
                          <div
                            className="text-gray-800 font-medium"
                            dangerouslySetInnerHTML={{ __html: item.data.Content || 'Không có nội dung' }}
                          />
                        </div>
                      </div>

                      {/* Answer Options & Explanation */}
                      <div className="ml-14 mb-4">
                        <div className="text-sm font-semibold text-gray-600 mb-3">Các đáp án:</div>
                        {renderAnswerOptions(item)}
                      </div>
                    </div>
                  );
                }

                return null;
              });
            })()}
          </div>
        )}

      </div>
    </div>
  );
};

export default ExamResultDetail;
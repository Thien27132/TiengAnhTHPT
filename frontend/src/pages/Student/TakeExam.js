import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

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

const getExamProgressKey = (examId) => `exam-progress-${examId}`;

const TakeExam = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const shouldStartFresh = searchParams.get('newAttempt') === 'true';
    
    const [examData, setExamData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingExam, setLoadingExam] = useState(true);
    const [currentQuestionId, setCurrentQuestionId] = useState(null);
    const [displayOrderMap, setDisplayOrderMap] = useState({}); // Track original order for DisplayOrder field
    const questionRefs = useRef({});

    useEffect(() => {
        const fetchExamDetail = async () => {
            try {
                const data = await axiosClient.get(`/exams/${id}`);
                let currentQuestionNumber = 1;
                const orderMap = {}; // Map questionId -> displayNumber
                
                // Process questions with correct numbering
                const processedQuestions = (data.questions || []).map(q => {
                    const mappedQ = {
                        ...q,
                        displayNumber: q.IsPassage ? null : currentQuestionNumber,
                        answers: (data.answers || []).filter(a => a.QuestionID === q.QuestionID)
                    };
                    if (!q.IsPassage) {
                        orderMap[q.QuestionID] = currentQuestionNumber;
                        currentQuestionNumber++;
                    }
                    return mappedQ;
                });

                setDisplayOrderMap(orderMap);

                // Replace [BLANK] with question numbers and parse Content from JSON
                const finalQuestions = processedQuestions.map(q => {
                    if (q.IsPassage) {
                        // Parse Content for passages (JSON format)
                        const parsedContent = parseContent(q.Content);
                        const hasPassage = parsedContent.passage?.trim().length > 0;
                        const promptContent = hasPassage ? parsedContent.prompt : '';
                        const passageContent = hasPassage ? parsedContent.passage : parsedContent.prompt || '';
                        
                        // Replace all [BLANK] placeholders with question numbers in passage
                        const childQuestions = processedQuestions.filter(child => child.ParentID === q.QuestionID);
                        const replacedPassageContent = replaceBlanksWithNumbers(passageContent, childQuestions);
                        
                        // Store both prompt and passage separately
                        return {
                            ...q,
                            promptContent,
                            passageContent: replacedPassageContent,
                            Content: q.Content // Keep original for backup
                        };
                    } else {
                        // For child questions, keep Content as-is
                        return { ...q };
                    }
                });

                // Preserve the original order from the teacher
                const orderedQuestions = finalQuestions;

                const savedProgress = shouldStartFresh ? null : (() => {
                    try {
                        const saved = localStorage.getItem(getExamProgressKey(id));
                        if (!saved) return null;
                        const parsed = JSON.parse(saved);
                        if (parsed?.examId !== String(id) && parsed?.examId !== Number(id)) return null;
                        if (parsed?.duration !== data.exam?.Duration) return null;
                        return parsed;
                    } catch (err) {
                        return null;
                    }
                })();

                if (shouldStartFresh) {
                    localStorage.removeItem(getExamProgressKey(id));
                }

                setExamData({ ...data.exam, questions: orderedQuestions });
                setTimeLeft(savedProgress?.timeLeft ?? (data.exam?.Duration || 0) * 60);
                setUserAnswers(savedProgress?.userAnswers || {});
                if (orderedQuestions.length > 0) {
                    const firstQuestion = orderedQuestions.find((q) => !q.IsPassage);
                    if (savedProgress?.currentQuestionId) {
                        setCurrentQuestionId(savedProgress.currentQuestionId);
                    } else if (firstQuestion) {
                        setCurrentQuestionId(firstQuestion.QuestionID);
                    }
                }
            } catch (error) {
                console.error('Lỗi tải đề thi', error);
            } finally {
                setLoadingExam(false);
            }
        };
        fetchExamDetail();
    }, [id]);

    const handleSelectAnswer = (questionId, answerId) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    const submitExamData = useCallback(async () => {
        if (!examData) return;
        setIsSubmitting(true);
        const formattedAnswers = Object.entries(userAnswers).reduce((acc, [qId, aId]) => {
            if (aId != null) {
                acc.push({
                    questionId: Number(qId),
                    selectedAnswerId: Number(aId),
                    displayOrder: displayOrderMap[Number(qId)] || null
                });
            }
            return acc;
        }, []);

        const storedUser = localStorage.getItem('user');
        let user = {};
        try {
            user = storedUser ? JSON.parse(storedUser) : {};
        } catch (err) {
            console.error('Invalid user data in localStorage', err);
            user = {};
        }

        const studentId = Number(user?.UserID);
        if (!studentId || isNaN(studentId)) {
            console.error('StudentID not found. User data:', user);
            alert('Bạn cần đăng nhập lại để nộp bài.');
            setIsSubmitting(false);
            return;
        }

        const completedTime = (examData.Duration || 0) * 60 - timeLeft;

        try {
            const result = await axiosClient.post('/exams/submit', {
                examId: Number(id),
                studentId,
                completedTime,
                userAnswers: formattedAnswers
            });
            localStorage.removeItem(getExamProgressKey(id));
            alert(`Nộp bài thành công! Điểm của bạn: ${result.score}/10`);
            // Redirect to exam result detail instead of dashboard
            navigate(`/exam-result/${result.resultId}`);
        } catch (error) {
            console.error('Lỗi nộp bài', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi nộp bài!');
        } finally {
            setIsSubmitting(false);
        }
    }, [examData, id, navigate, userAnswers, timeLeft, displayOrderMap]);

    const handleManualSubmit = () => {
        if (window.confirm('Bạn có chắc chắn muốn nộp bài sớm không?')) {
            submitExamData();
        }
    };

    useEffect(() => {
        if (!examData) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [examData]);

    useEffect(() => {
        if (!examData) return;
        if (timeLeft === 0 && !isSubmitting) {
            alert('Đã hết thời gian làm bài! Hệ thống tự động nộp bài.');
            submitExamData();
        }
    }, [timeLeft, examData, isSubmitting, submitExamData]);

    useEffect(() => {
        if (!examData) return;
        try {
            localStorage.setItem(getExamProgressKey(id), JSON.stringify({
                examId: id,
                duration: examData.Duration,
                timeLeft,
                userAnswers,
                currentQuestionId
            }));
        } catch (err) {
            console.error('Không thể lưu tiến độ bài thi:', err);
        }
    }, [id, examData, timeLeft, userAnswers, currentQuestionId]);

    const nonPassageQuestions = examData?.questions.filter((q) => !q.IsPassage) || [];

    const scrollToQuestion = (questionId) => {
        const target = questionRefs.current[questionId];
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setCurrentQuestionId(questionId);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.max(seconds % 60, 0).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loadingExam) {
        return <div className="flex justify-center items-center h-screen">Đang tải đề thi...</div>;
    }

    if (!examData) {
        return <div className="flex justify-center items-center h-screen">Không tìm thấy dữ liệu đề thi.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 pb-20">
            <div className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-4 md:flex-row justify-between items-center">
                    <div>
                        <h1 className="font-bold text-lg text-gray-800">{examData.ExamName}</h1>
                        <p className="text-sm text-gray-500 mt-1">Thời gian: {examData.Duration || 0} phút</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`font-mono text-2xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <button 
                            onClick={handleManualSubmit}
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
                        >
                            {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 max-w-6xl mx-auto mt-8 px-4">
                <div>
                    {examData.questions.map((q) => (
                        <div
                            key={q.QuestionID}
                            id={`question-${q.QuestionID}`}
                            ref={(el) => { questionRefs.current[q.QuestionID] = el; }}
                            className="bg-white rounded-xl shadow-sm p-6 mb-6"
                        >
                            {q.IsPassage && (
                                <>
                                    {/* Display prompt as question */}
                                    {q.promptContent && (
                                        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                                            <h3 className="text-sm font-semibold text-blue-800 mb-2">📖 Đề bài</h3>
                                            <div 
                                                className="text-gray-800 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: q.promptContent }}
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Display passage text */}
                                    {q.passageContent && (
                                        <div 
                                            className="mb-4 p-4 bg-gray-50 border-l-4 border-gray-400 rounded text-gray-800 leading-relaxed shadow-sm"
                                            dangerouslySetInnerHTML={{ __html: q.passageContent }}
                                        />
                                    )}
                                </>
                            )}

                            {!q.IsPassage && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-800">
                                        <span className="font-bold text-indigo-600 mr-2">Question {q.displayNumber}:</span>
                                        {q.Content && <span dangerouslySetInnerHTML={{ __html: q.Content }} />}
                                    </h3>
                                    <div className="space-y-3">
                                        {q.answers.map(ans => (
                                            <label 
                                                key={ans.AnswerID}
                                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    userAnswers[q.QuestionID] === ans.AnswerID 
                                                        ? 'border-indigo-600 bg-indigo-50' 
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input 
                                                    type="radio"
                                                    name={`question-${q.QuestionID}`}
                                                    value={ans.AnswerID}
                                                    checked={userAnswers[q.QuestionID] === ans.AnswerID}
                                                    onChange={() => handleSelectAnswer(q.QuestionID, ans.AnswerID)}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 flex-shrink-0 mt-0.5"
                                                />
                                                <span 
                                                    className="ml-3 text-gray-700"
                                                    dangerouslySetInnerHTML={{ __html: ans.AnswerContent }}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="sticky top-24 self-start">
                    <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">Bảng câu hỏi</h2>
                            <span className="text-sm text-gray-500">{nonPassageQuestions.length}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {nonPassageQuestions
                                .sort((a, b) => a.displayNumber - b.displayNumber)
                                .map((q) => {
                                const answered = userAnswers[q.QuestionID] != null;
                                const active = currentQuestionId === q.QuestionID;
                                return (
                                    <button
                                        key={q.QuestionID}
                                        type="button"
                                        onClick={() => scrollToQuestion(q.QuestionID)}
                                        className={`h-10 w-10 rounded-full border flex items-center justify-center text-sm font-semibold transition ${
                                            answered ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                        } ${active ? 'ring-2 ring-indigo-500' : ''}`}
                                    >
                                        {q.displayNumber}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 text-sm text-gray-500 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-green-600"></span>
                                <span>Đã làm</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-gray-300"></span>
                                <span>Chưa làm</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TakeExam;
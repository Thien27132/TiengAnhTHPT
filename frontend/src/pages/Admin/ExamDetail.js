import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { ArrowLeft, Loader } from 'lucide-react';

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

const ExamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExamDetail = async () => {
            try {
                const data = await axiosClient.get(`/exams/${id}`);
                setExamData(data);
            } catch (error) {
                console.error('Lỗi lấy chi tiết đề thi', error);
                alert('Không thể tải dữ liệu đề thi');
            } finally {
                setLoading(false);
            }
        };
        fetchExamDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="flex items-center gap-2 text-gray-600">
                    <Loader className="animate-spin" size={24} />
                    <span>Đang tải chi tiết đề thi...</span>
                </div>
            </div>
        );
    }

    if (!examData) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm">
                <button 
                    onClick={() => navigate('/admin/exams')}
                    className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                >
                    <ArrowLeft size={20} />
                    Quay lại
                </button>
                <p className="text-center text-gray-500">Không tìm thấy đề thi</p>
            </div>
        );
    }

    const { exam, questions = [], answers = [] } = examData;

    // Group questions by passages
    const groupedQuestions = [];
    let currentPassage = null;
    let passageQuestions = [];

    questions.forEach(q => {
        if (q.IsPassage) {
            if (currentPassage) {
                groupedQuestions.push({ passage: currentPassage, childQ: passageQuestions });
            }
            currentPassage = q;
            passageQuestions = [];
        } else {
            passageQuestions.push(q);
        }
    });

    if (currentPassage) {
        groupedQuestions.push({ passage: currentPassage, childQ: passageQuestions });
    }

    let questionNumber = 1;
    const questionNumberMap = {};
    groupedQuestions.forEach((group) => {
        group.childQ.forEach((q) => {
            questionNumberMap[q.QuestionID] = questionNumber++;
        });
    });

    return (
        <div className="p-6 space-y-6">
            <button 
                onClick={() => navigate('/admin/exams')}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition"
            >
                <ArrowLeft size={20} />
                Quay lại
            </button>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 break-words">{exam.ExamName}</h2>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Mức độ</p>
                        <p className="font-semibold text-blue-700">{exam.Level}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Thời gian</p>
                        <p className="font-semibold text-green-700">{exam.Duration} phút</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Tổng câu hỏi</p>
                        <p className="font-semibold text-purple-700">{exam.TotalQuestions || questions.length} câu</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Ngày tạo</p>
                        <p className="font-semibold text-orange-700">{new Date(exam.CreatedAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Danh sách câu hỏi</h3>

                    <div className="space-y-8">
                        {groupedQuestions.length > 0 ? (
                            groupedQuestions.map((group, groupIdx) => (
                                <div key={groupIdx} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                                    {group.passage && (
                                        <div className="mb-6 pb-6 border-b border-gray-300">
                                            {(() => {
                                                const parsedContent = parseContent(group.passage.Content);
                                                const hasPassage = parsedContent.passage?.trim().length > 0;
                                                const promptText = hasPassage ? parsedContent.prompt : '';
                                                const passageText = hasPassage ? parsedContent.passage : parsedContent.prompt;
                                                const childNumbered = group.childQ.map(q => ({ displayNumber: questionNumberMap[q.QuestionID] }));
                                                return (
                                                    <>
                                                        {promptText ? (
                                                            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500 mb-4">
                                                                <p className="text-sm font-semibold text-blue-800 mb-2">📖 Đề bài</p>
                                                                <div
                                                                    className="text-gray-800 leading-relaxed"
                                                                    dangerouslySetInnerHTML={{ __html: promptText }}
                                                                />
                                                            </div>
                                                        ) : null}
                                                        {passageText ? (
                                                            <div className="p-4 bg-gray-100 rounded-lg border-l-4 border-gray-400">
                                                                <p className="text-sm font-semibold text-gray-700 mb-2">📝 Đoạn văn</p>
                                                                <div
                                                                    className="text-gray-800 leading-relaxed"
                                                                    dangerouslySetInnerHTML={{ __html: replaceBlanksWithNumbers(passageText, childNumbered) }}
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {group.childQ.map((q, idx) => {
                                            const questionAnswers = answers.filter(a => a.QuestionID === q.QuestionID);
                                            return (
                                                <div key={q.QuestionID} className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                                            Q{questionNumberMap[q.QuestionID] || idx + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-800">
                                                                {q.Content ? (
                                                                    <span dangerouslySetInnerHTML={{ __html: q.Content }} />
                                                                ) : (
                                                                    'Câu hỏi không có nội dung text'
                                                                )}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Loại: <span className="font-medium">{q.QuestionType}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="ml-12 space-y-2">
                                                        {questionAnswers.map((ans, ansIdx) => (
                                                            <div
                                                                key={ans.AnswerID}
                                                                className={`p-3 rounded-lg border-2 ${
                                                                    ans.IsCorrect === 1
                                                                        ? 'border-green-400 bg-green-50'
                                                                        : 'border-gray-200 bg-white'
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                        ans.IsCorrect === 1
                                                                            ? 'bg-green-500 text-white'
                                                                            : 'bg-gray-200 text-gray-700'
                                                                    }`}>
                                                                        {String.fromCharCode(65 + ansIdx)}
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: ans.AnswerContent }} />
                                                                    </div>
                                                                    {ans.IsCorrect === 1 && (
                                                                        <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded">
                                                                            ĐÚng
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Đề thi chưa có câu hỏi
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamDetail;

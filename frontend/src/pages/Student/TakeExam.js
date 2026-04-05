import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TakeExam = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [examData, setExamData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // Lưu dạng { questionId: selectedAnswerId }
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchExamDetail = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/exams/${id}`);
                const data = await response.json();
                
                // --- LỚP 1: Gán số thứ tự chuẩn xác cho các Câu hỏi ---
                let currentQuestionNumber = 1; 
                const processedQuestions = data.questions.map(q => {
                    const mappedQ = {
                        ...q,
                        // Nếu là đoạn văn thì ko có số, nếu là câu hỏi thì lấy số hiện tại
                        displayNumber: q.IsPassage ? null : currentQuestionNumber, 
                        answers: data.answers.filter(a => a.QuestionID === q.QuestionID)
                    };
                    
                    // Chỉ tăng số thứ tự lên 1 nếu nó KHÔNG phải là đoạn văn
                    if (!q.IsPassage) {
                        currentQuestionNumber++; 
                    }
                    
                    return mappedQ;
                });

                // --- LỚP 2: Tìm và thay thế chữ [BLANK] bằng số thứ tự ---
                const finalQuestions = processedQuestions.map(q => {
                    let newContent = q.Content;

                    if (q.IsPassage) {
                        // Nếu là đoạn văn: Tìm các câu hỏi con của nó
                        const childQuestions = processedQuestions.filter(child => child.ParentID === q.QuestionID);
                        
                        // Thay thế lần lượt từng chữ [BLANK] bằng số thứ tự của câu hỏi con tương ứng
                        childQuestions.forEach(child => {
                            if (newContent.includes('[BLANK]')) {
                                newContent = newContent.replace(
                                    '[BLANK]', 
                                    `<span class="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 mx-1 rounded shadow-sm">(${child.displayNumber})</span>`
                                );
                            }
                        });
                    } else {
                        // Nếu là câu hỏi độc lập có chứa [BLANK]
                        if (newContent.includes('[BLANK]')) {
                            newContent = newContent.replace(
                                '[BLANK]', 
                                `<span class="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 mx-1 rounded shadow-sm">(${q.displayNumber})</span>`
                            );
                        }
                    }

                    return { ...q, Content: newContent };
                });

                setExamData({ ...data.exam, questions: finalQuestions });
                setTimeLeft(data.exam.Duration * 60); // Đổi phút ra giây
            } catch (error) {
                console.error("Lỗi tải đề thi", error);
            }
        };
        fetchExamDetail();
    }, [id]);

    // BỘ ĐẾM NGƯỢC THỜI GIAN
    useEffect(() => {
        if (timeLeft <= 0 && examData) {
            handleAutoSubmit();
            return;
        }
        
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, examData]);

    const handleSelectAnswer = (questionId, answerId) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    const submitExamData = async () => {
        setIsSubmitting(true);
        const formattedAnswers = Object.entries(userAnswers).map(([qId, aId]) => ({
            questionId: parseInt(qId),
            selectedAnswerId: parseInt(aId)
        }));

        const user = JSON.parse(localStorage.getItem('user'));
        const completedTime = (examData.Duration * 60) - timeLeft;

        try {
            const response = await fetch(`http://localhost:5000/api/exams/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId: id,
                    studentId: user.UserID || 1,
                    completedTime: completedTime,
                    userAnswers: formattedAnswers
                })
            });
            const result = await response.json();
            alert(`Nộp bài thành công! Điểm của bạn: ${result.score}/10`);
            navigate('/dashboard'); 
        } catch (error) {
            console.error("Lỗi nộp bài", error);
            alert("Có lỗi xảy ra khi nộp bài!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoSubmit = () => {
        alert("Đã hết thời gian làm bài! Hệ thống đang tự động nộp...");
        submitExamData();
    };

    const handleManualSubmit = () => {
        if(window.confirm("Bạn có chắc chắn muốn nộp bài sớm không?")) {
            submitExamData();
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!examData) return <div className="flex justify-center items-center h-screen">Đang tải đề thi...</div>;

    return (
        <div className="min-h-screen bg-gray-100 pb-20">
            {/* THANH ĐIỀU HƯỚNG CỐ ĐỊNH TRÊN CÙNG */}
            <div className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="font-bold text-lg text-gray-800">{examData.ExamName}</h1>
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

            {/* DANH SÁCH CÂU HỎI */}
            <div className="max-w-4xl mx-auto mt-8 px-4">
                {examData.questions.map((q) => (
                    <div key={q.QuestionID} className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        {/* Hiển thị đoạn văn nếu là câu hỏi nối tiếp */}
                        {q.IsPassage && (
                            <div 
                                className="mb-4 p-5 bg-gray-50 border-l-4 border-indigo-500 rounded-r-lg text-gray-800 leading-relaxed shadow-sm"
                                dangerouslySetInnerHTML={{ __html: q.Content }}
                            />
                        )}
                        
                        {/* Nội dung câu hỏi */}
                        {!q.IsPassage && (
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-start">
                                <span className="font-bold text-indigo-600 mr-2 whitespace-nowrap">Câu {q.displayNumber}:</span>
                                <span dangerouslySetInnerHTML={{ __html: q.Content }}></span>
                            </h3>
                        )}

                        {/* Danh sách đáp án */}
                        {!q.IsPassage && (
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
                                        ></span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TakeExam;
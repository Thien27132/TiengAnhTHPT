import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Lấy danh sách đề thi từ Backend
        const fetchExams = async () => {
            try {
                // Thay URL này bằng cấu hình axios thực tế của bạn
                const response = await fetch('http://localhost:5000/api/exams'); 
                const data = await response.json();
                setExams(data);
            } catch (error) {
                console.error("Lỗi lấy danh sách đề thi:", error);
            }
        };
        fetchExams();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-indigo-900 mb-8">Danh sách Đề thi</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => (
                        <div key={exam.ExamID} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">{exam.ExamName}</h2>
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                    {exam.Level}
                                </span>
                            </div>
                            
                            <div className="space-y-2 mb-6 text-sm text-gray-600">
                                <p className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Thời gian: <strong className="ml-1">{exam.Duration} phút</strong>
                                </p>
                                <p className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                    Số câu hỏi: <strong className="ml-1">{exam.TotalQuestions} câu</strong>
                                </p>
                            </div>

                            <button 
                                onClick={() => navigate(`/take-exam/${exam.ExamID}`)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Vào thi ngay
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExamList;
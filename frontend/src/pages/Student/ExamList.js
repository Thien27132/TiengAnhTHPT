import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const data = await axiosClient.get('/exams');
                setExams(data || []);
            } catch (error) {
                console.error('Lỗi lấy danh sách đề thi:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchExams();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-indigo-900 mb-8">Danh sách Đề thi</h1>

                {isLoading ? (
                    <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">Đang tải danh sách đề thi...</div>
                ) : exams.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">Chưa có đề thi nào. Vui lòng quay lại sau.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map(exam => (
                            <div key={exam.ExamID} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-semibold text-gray-800">{exam.ExamName}</h2>
                                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                        {exam.Level || 'Không xác định'}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6 text-sm text-gray-600">
                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold">Thời gian:</span>
                                        <span>{exam.Duration || 0} phút</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="font-semibold">Số câu hỏi:</span>
                                        <span>{exam.TotalQuestions || 0} câu</span>
                                    </p>
                                    <p className="text-gray-400 text-xs">Ngày tạo: {exam.CreatedAt ? new Date(exam.CreatedAt).toLocaleDateString() : '---'}</p>
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
                )}
            </div>
        </div>
    );
};

export default ExamList;
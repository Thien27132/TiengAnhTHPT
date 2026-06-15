import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
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

    const filteredExams = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return exams.filter((exam) => {
            const matchesSearch = [exam.ExamName, exam.Level, exam.Description]
                .filter(Boolean)
                .some((field) => field.toLowerCase().includes(lowerSearch));
            const matchesLevel = selectedLevel ? exam.Level === selectedLevel : true;
            return matchesSearch && matchesLevel;
        });
    }, [exams, searchTerm, selectedLevel]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mb-3"
                        >
                            <ArrowLeft size={18} /> Quay lại
                        </button>
                        <h1 className="text-3xl font-bold text-indigo-900">Danh sách Đề thi</h1>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] w-full md:w-auto">
                        <div className="relative">
                            <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm đề thi..."
                                className="w-full pl-10 rounded-2xl border border-gray-300 py-3 pr-4 outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Tất cả mức độ</option>
                            <option value="Dễ">Dễ</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Khó">Khó</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">Đang tải danh sách đề thi...</div>
                ) : filteredExams.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">Không tìm thấy đề thi phù hợp.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map((exam) => (
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
                                    onClick={() => navigate(`/take-exam/${exam.ExamID}?newAttempt=true`)}
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
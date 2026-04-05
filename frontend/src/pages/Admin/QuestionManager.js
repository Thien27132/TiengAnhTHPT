import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const QuestionManager = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    // Giả sử bạn đã có route Backend: GET /api/questions
    const fetchData = async () => {
      try {
        const data = await axiosClient.get('/questions');
        setQuestions(data);
      } catch (err) {
        console.error("Lỗi lấy danh sách câu hỏi");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Ngân hàng câu hỏi</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          + Thêm câu mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 uppercase text-sm">
              <th className="p-4 border-b">Nội dung</th>
              <th className="p-4 border-b">Loại</th>
              <th className="p-4 border-b">Mức độ</th>
              <th className="p-4 border-b">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.QuestionID} className="hover:bg-gray-50 transition">
                <td className="p-4 border-b max-w-md">
                  {/* Sử dụng dangerouslySetInnerHTML cho các thẻ HTML từ DB */}
                  <div 
                    className="truncate text-gray-700 italic"
                    dangerouslySetInnerHTML={{ __html: q.Content }} 
                  />
                </td>
                <td className="p-4 border-b text-sm">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {q.QuestionType || 'Single'}
                  </span>
                </td>
                <td className="p-4 border-b text-sm">{q.Level}</td>
                <td className="p-4 border-b">
                  <button className="text-blue-600 mr-3">Sửa</button>
                  <button className="text-red-600">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionManager;
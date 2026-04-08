import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const QuestionList = ({
  questions,
  expandedRows,
  rowDetails,
  rowLoading,
  onToggleRowDetails,
  onEdit,
  onDelete,
  onViewDetail
}) => {
  const renderChildCount = (q) => (q.QuestionType === 'Ordering' ? 1 : q.ChildCount || 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 uppercase text-sm">
            <th className="p-4 border-b">Đề bài</th>
            <th className="p-4 border-b">Tags / Kỹ năng</th>
            <th className="p-4 border-b">Loại</th>
            <th className="p-4 border-b">Số câu</th>
            <th className="p-4 border-b">Mức độ</th>
            <th className="p-4 border-b">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {questions.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-6 text-center text-gray-500">
                Không tìm thấy đề nào. Vui lòng thử lại với từ khóa khác hoặc tạo mới.
              </td>
            </tr>
          ) : (
            questions.map((q) => (
              <React.Fragment key={q.QuestionID}>
                <tr className="hover:bg-gray-50 transition">
                  <td className="p-4 border-b max-w-xl break-words">
                    <div className="mb-2 text-gray-700 text-sm font-semibold" dangerouslySetInnerHTML={{ __html: q.Prompt || 'Không có đề bài rõ ràng' }} />
                    {q.Passage && (
                      <div className="text-xs text-gray-500 line-clamp-3" dangerouslySetInnerHTML={{ __html: q.Passage }} />
                    )}
                  </td>
                  <td className="p-4 border-b text-sm">
                    <div className="flex flex-wrap gap-2">
                      {(q.Tags || []).map((tag) => (
                        <span key={tag.TagID} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                          {tag.TagName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 border-b text-sm">{q.QuestionType}</td>
                  <td className="p-4 border-b text-sm">{renderChildCount(q)}</td>
                  <td className="p-4 border-b text-sm">{q.Level}</td>
                  <td className="p-4 border-b">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onViewDetail(q.QuestionID)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        onClick={() => onToggleRowDetails(q)}
                        className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
                      >
                        {expandedRows[q.QuestionID] ? 'Ẩn chi tiết' : 'Xem nhanh'}
                      </button>
                      <button
                        onClick={() => onEdit(q)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={16} /> Sửa
                      </button>
                      <button
                        onClick={() => onDelete(q.QuestionID)}
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows[q.QuestionID] && (
                  <tr className="bg-slate-50">
                    <td colSpan="6" className="p-4 border-b">
                      {rowLoading[q.QuestionID] ? (
                        <div className="text-sm text-gray-600">Đang tải chi tiết...</div>
                      ) : (
                        <div className="space-y-4">
                          {(rowDetails[q.QuestionID]?.questions || []).map((item, idx) => (
                            <div key={item.questionId || idx} className="rounded-3xl border border-gray-200 bg-white p-4">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="text-sm font-semibold">Câu {idx + 1}</div>
                                <span className="text-xs text-gray-500">Loại: {rowDetails[q.QuestionID]?.questionType || q.QuestionType}</span>
                              </div>
                              {item.questionContent ? (
                                <div className="text-sm text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: item.questionContent }} />
                              ) : (
                                <div className="text-sm text-gray-500 mb-3">Không có nội dung câu hỏi.</div>
                              )}
                              <div className="grid gap-3">
                                {(item.answers || []).map((ans, ansIdx) => (
                                  <div key={ans.AnswerID || ansIdx} className={`rounded-3xl border p-3 ${ans.IsCorrect === 1 || ans.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
                                      <span>{String.fromCharCode(65 + ansIdx)}.</span>
                                      {(ans.IsCorrect === 1 || ans.isCorrect) && <span className="text-emerald-700">Đúng</span>}
                                    </div>
                                    <div className="mt-2 text-gray-700" dangerouslySetInnerHTML={{ __html: ans.AnswerContent || ans.content || '' }} />
                                    {(ans.Explanation || ans.explanation) && (
                                      <div className="mt-2 text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: ans.Explanation || ans.explanation || '' }} />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default QuestionList;
import React, { useState } from 'react';

const StudentRanking = ({ data }) => {
    const [expandedTag, setExpandedTag] = useState(null);

    return (
        <div className="ranking-container">
            {Object.keys(data).length === 0 ? (
                <div className="empty-state">
                    <p>Không có dữ liệu xếp hạng</p>
                </div>
            ) : (
                Object.entries(data).map(([tagId, tagData]) => (
                    <div key={tagId} className="ranking-card">
                        <div 
                            className="ranking-header"
                            onClick={() => setExpandedTag(expandedTag === tagId ? null : tagId)}
                        >
                            <h3>{tagData.tagName}</h3>
                            <span className="expand-icon">
                                {expandedTag === tagId ? '▼' : '▶'}
                            </span>
                        </div>

                        {expandedTag === tagId && (
                            <div className="ranking-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Hạng</th>
                                            <th>Tên Học Sinh</th>
                                            <th>Tổng Làm</th>
                                            <th>Đúng</th>
                                            <th>Sai</th>
                                            <th>Tỷ Lệ Sai</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tagData.rankings.map((student, idx) => (
                                            <tr key={idx} className={`rank-${idx + 1}`}>
                                                <td className="rank-badge">
                                                    {idx + 1 === 1 && '🥇'}
                                                    {idx + 1 === 2 && '🥈'}
                                                    {idx + 1 === 3 && '🥉'}
                                                    {idx + 1 > 3 && idx + 1}
                                                </td>
                                                <td>{student.UserName}</td>
                                                <td>{student.TotalAttempted}</td>
                                                <td>
                                                    <span className="success">
                                                        {student.CorrectCount}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="error">
                                                        {student.IncorrectCount}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`error-rate ${
                                                        student.ErrorRate < 30 ? 'good' :
                                                        student.ErrorRate < 60 ? 'medium' :
                                                        'bad'
                                                    }`}>
                                                        {student.ErrorRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default StudentRanking;

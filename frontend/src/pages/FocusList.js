import React, { useState } from 'react';

const FocusList = ({ data }) => {
    const [expandedTag, setExpandedTag] = useState(null);

    return (
        <div className="focus-list-container">
            {Object.keys(data).length === 0 ? (
                <div className="empty-state">
                    <p>Không có dữ liệu học sinh cần focus</p>
                </div>
            ) : (
                Object.entries(data).map(([tagId, tagData]) => (
                    <div key={tagId} className="focus-card">
                        <div 
                            className="focus-header"
                            onClick={() => setExpandedTag(expandedTag === tagId ? null : tagId)}
                        >
                            <h3>{tagData.tagName}</h3>
                            <span className="expand-icon">
                                {expandedTag === tagId ? '▼' : '▶'}
                            </span>
                        </div>

                        {expandedTag === tagId && (
                            <div className="focus-content">
                                {/* Học sinh xuất sắc */}
                                {tagData.excellent && tagData.excellent.length > 0 && (
                                    <div className="excellent-section">
                                        <h4>⭐ Học Sinh Xuất Sắc</h4>
                                        <div className="student-list">
                                            {tagData.excellent.map((student, idx) => (
                                                <div key={idx} className="student-item excellent">
                                                    <div className="student-info">
                                                        <span className="medal">🌟</span>
                                                        <span className="name">{student.UserName}</span>
                                                    </div>
                                                    <span className="error-rate excellent-rate">
                                                        {student.ErrorRate}% sai
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Học sinh cần hỗ trợ */}
                                {tagData.needSupport && tagData.needSupport.length > 0 && (
                                    <div className="support-section">
                                        <h4>🔴 Học Sinh Cần Hỗ Trợ</h4>
                                        <div className="student-list">
                                            {tagData.needSupport.map((student, idx) => (
                                                <div key={idx} className="student-item support">
                                                    <div className="student-info">
                                                        <span className="warning">⚠️</span>
                                                        <span className="name">{student.UserName}</span>
                                                    </div>
                                                    <span className="error-rate support-rate">
                                                        {student.ErrorRate}% sai
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {tagData.excellent.length === 0 && tagData.needSupport.length === 0 && (
                                    <div className="no-data">
                                        <p>Không có học sinh nào trong danh sách focus</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default FocusList;

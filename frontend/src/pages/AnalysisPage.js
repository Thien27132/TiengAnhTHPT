import React, { useState, useEffect, useCallback } from 'react';
import analysisApi from '../api/analysisApi';
import ErrorRateChart from './ErrorRateChart';
import StudentRanking from './StudentRanking';
import DistributionChart from './DistributionChart';
import FocusList from './FocusList';
import './AnalysisPage.css';

const AnalysisPage = () => {
    const [errorRateData, setErrorRateData] = useState([]);
    const [rankingData, setRankingData] = useState({});
    const [distributionData, setDistributionData] = useState({});
    const [focusListData, setFocusListData] = useState({});
    const [selectedTag, setSelectedTag] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('error-rate');

    const fetchAnalysisData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Lấy dữ liệu tỷ lệ sai theo tag
            const errorRateRes = await analysisApi.getErrorRateByTagSystem();
            setErrorRateData(errorRateRes.data);

            // Lấy dữ liệu xếp hạng
            const rankingRes = await analysisApi.rankStudentsByTag(selectedTag);
            setRankingData(rankingRes.data);

            // Lấy dữ liệu phân bố
            const distributionRes = await analysisApi.getStudentDistributionByErrorRate(selectedTag);
            setDistributionData(distributionRes.data);

            // Lấy danh sách cần focus
            const focusRes = await analysisApi.getStudentsFocusList(selectedTag);
            setFocusListData(focusRes.data);
        } catch (err) {
            console.error('Error fetching analysis data:', err);
            setError('Lỗi tải dữ liệu phân tích: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedTag]);

    useEffect(() => {
        fetchAnalysisData();
    }, [fetchAnalysisData]);

    if (loading && !errorRateData.length) {
        return <div className="loading">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="analysis-page">
            <h1>📊 Phân Tích Tỷ Lệ Sai Theo Tag</h1>
            
            {error && <div className="error-alert">{error}</div>}

            {/* Tabs */}
            <div className="tab-container">
                <button 
                    className={`tab-btn ${activeTab === 'error-rate' ? 'active' : ''}`}
                    onClick={() => setActiveTab('error-rate')}
                >
                    📈 Tỷ Lệ Sai
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ranking')}
                >
                    🏆 Xếp Hạng
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'distribution' ? 'active' : ''}`}
                    onClick={() => setActiveTab('distribution')}
                >
                    📊 Phân Bố
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'focus' ? 'active' : ''}`}
                    onClick={() => setActiveTab('focus')}
                >
                    ⭐ Cần Focus
                </button>
            </div>

            {/* Content */}
            <div className="tab-content">
                {activeTab === 'error-rate' && (
                    <div className="error-rate-section">
                        <h2>Tỷ Lệ Sai Theo Tag (Toàn Hệ Thống)</h2>
                        <ErrorRateChart data={errorRateData} />
                        
                        <div className="table-container">
                            <table className="analysis-table">
                                <thead>
                                    <tr>
                                        <th>Tag</th>
                                        <th>Tổng Câu Hỏi</th>
                                        <th>Tổng Lần Làm</th>
                                        <th>Học Sinh Duy Nhất</th>
                                        <th>Sai (%)</th>
                                        <th>Đúng (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {errorRateData.map((row) => (
                                        <tr key={row.TagID} onClick={() => setSelectedTag(row.TagID)} className="clickable-row">
                                            <td className="tag-name">{row.TagName}</td>
                                            <td>{row.TotalQuestions}</td>
                                            <td>{row.TotalAttempts}</td>
                                            <td>{row.UniqueStudents}</td>
                                            <td>
                                                <span className="error-rate">
                                                    {row.ErrorRate}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className="success-rate">
                                                    {row.SuccessRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'ranking' && (
                    <div className="ranking-section">
                        <h2>Xếp Hạng Học Sinh Theo Tag</h2>
                        <StudentRanking data={rankingData} />
                    </div>
                )}

                {activeTab === 'distribution' && (
                    <div className="distribution-section">
                        <h2>Phân Bố Học Sinh Theo Mức Độ</h2>
                        <DistributionChart data={distributionData} />
                    </div>
                )}

                {activeTab === 'focus' && (
                    <div className="focus-section">
                        <h2>Danh Sách Học Sinh Cần Focus</h2>
                        <FocusList data={focusListData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisPage;

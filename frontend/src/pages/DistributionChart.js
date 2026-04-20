import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const DistributionChart = ({ data }) => {
    const [chartData, setChartData] = useState(null);
    const [doughnutData, setDoughnutData] = useState(null);

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            // Lấy tag đầu tiên để hiển thị
            const firstTagId = Object.keys(data)[0];
            const firstTag = data[firstTagId];

            if (firstTag && firstTag.distribution) {
                // Bar chart
                const barChart = {
                    labels: firstTag.distribution.map(item => item.errorGroup),
                    datasets: [{
                        label: 'Số Học Sinh',
                        data: firstTag.distribution.map(item => item.studentCount),
                        backgroundColor: [
                            '#6bcf7f',  // Xuất sắc
                            '#ffd93d',  // Tốt
                            '#ffa94d',  // Khá
                            '#ff9500',  // Yếu
                            '#ff6b6b'   // Rất yếu
                        ],
                        borderColor: [
                            '#51cf66',
                            '#f59f00',
                            '#fd7e14',
                            '#d9480f',
                            '#c92a2a'
                        ],
                        borderWidth: 2,
                    }]
                };

                // Doughnut chart
                const doughnutChart = {
                    labels: firstTag.distribution.map(item => item.errorGroup),
                    datasets: [{
                        data: firstTag.distribution.map(item => item.percentage),
                        backgroundColor: [
                            '#6bcf7f',
                            '#ffd93d',
                            '#ffa94d',
                            '#ff9500',
                            '#ff6b6b'
                        ],
                        borderColor: [
                            '#51cf66',
                            '#f59f00',
                            '#fd7e14',
                            '#d9480f',
                            '#c92a2a'
                        ],
                        borderWidth: 2,
                    }]
                };

                setChartData(barChart);
                setDoughnutData(doughnutChart);
            }
        }
    }, [data]);

    return (
        <div className="distribution-container">
            <div className="chart-section">
                <h3>Phân Bố Số Lượng Học Sinh</h3>
                {chartData && (
                    <Bar 
                        data={chartData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    display: false,
                                },
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1,
                                    }
                                }
                            }
                        }}
                    />
                )}
            </div>

            <div className="chart-section">
                <h3>Tỷ Lệ Phần Trăm</h3>
                {doughnutData && (
                    <Doughnut 
                        data={doughnutData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                },
                            }
                        }}
                    />
                )}
            </div>

            {data && Object.keys(data).length > 0 && (
                <div className="distribution-details">
                    <h3>Chi Tiết Phân Bố</h3>
                    <div className="details-grid">
                        {Object.entries(data).map(([tagId, tagData]) => (
                            <div key={tagId} className="tag-distribution">
                                <h4>{tagData.tagName}</h4>
                                {tagData.distribution.map((item, idx) => (
                                    <div key={idx} className="distribution-item">
                                        <span className="error-group">{item.errorGroup}</span>
                                        <div className="bar">
                                            <div 
                                                className="bar-fill"
                                                style={{
                                                    width: item.percentage + '%',
                                                    backgroundColor: [
                                                        '#6bcf7f',
                                                        '#ffd93d',
                                                        '#ffa94d',
                                                        '#ff9500',
                                                        '#ff6b6b'
                                                    ][idx]
                                                }}
                                            />
                                        </div>
                                        <span className="stats">
                                            {item.studentCount} ({item.percentage}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DistributionChart;

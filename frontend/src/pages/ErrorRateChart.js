import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
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

const ErrorRateChart = ({ data }) => {
    const [chartData, setChartData] = useState(null);
    const [pieData, setPieData] = useState(null);

    useEffect(() => {
        if (data && data.length > 0) {
            // Bar chart data
            const barChart = {
                labels: data.map(item => item.TagName),
                datasets: [
                    {
                        label: 'Tỷ Lệ Sai (%)',
                        data: data.map(item => item.ErrorRate),
                        backgroundColor: data.map(item => 
                            item.ErrorRate > 60 ? '#ff6b6b' : 
                            item.ErrorRate > 40 ? '#ffa94d' : 
                            item.ErrorRate > 20 ? '#ffd93d' : 
                            '#6bcf7f'
                        ),
                        borderColor: data.map(item => 
                            item.ErrorRate > 60 ? '#c92a2a' : 
                            item.ErrorRate > 40 ? '#fd7e14' : 
                            item.ErrorRate > 20 ? '#f59f00' : 
                            '#51cf66'
                        ),
                        borderWidth: 2,
                    },
                    {
                        label: 'Tỷ Lệ Đúng (%)',
                        data: data.map(item => item.SuccessRate),
                        backgroundColor: 'rgba(107, 199, 127, 0.6)',
                        borderColor: 'rgba(107, 199, 127, 1)',
                        borderWidth: 2,
                    }
                ]
            };

            // Pie chart data
            const highErrorTags = data.filter(item => item.ErrorRate > 50).length;
            const normalErrorTags = data.filter(item => item.ErrorRate >= 30 && item.ErrorRate <= 50).length;
            const lowErrorTags = data.filter(item => item.ErrorRate < 30).length;

            const pieChart = {
                labels: ['Khó (>50%)', 'Trung bình (30-50%)', 'Dễ (<30%)'],
                datasets: [{
                    data: [highErrorTags, normalErrorTags, lowErrorTags],
                    backgroundColor: ['#ff6b6b', '#ffa94d', '#6bcf7f'],
                    borderColor: ['#c92a2a', '#fd7e14', '#51cf66'],
                    borderWidth: 2,
                }]
            };

            setChartData(barChart);
            setPieData(pieChart);
        }
    }, [data]);

    return (
        <div className="chart-container">
            <div className="chart-section">
                <h3>Biểu Đồ Tỷ Lệ Sai Theo Tag</h3>
                {chartData && (
                    <div className="bar-chart">
                        <Bar 
                            data={chartData}
                            options={{
                                indexAxis: 'x',
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: false,
                                    },
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        ticks: {
                                            callback: function(value) {
                                                return value + '%';
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="chart-section">
                <h3>Phân Loại Độ Khó Của Tag</h3>
                {pieData && (
                    <div className="pie-chart">
                        <Pie 
                            data={pieData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                    },
                                }
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="stats-container">
                <div className="stat-card stat-high">
                    <h4>🔴 Tag Khó Nhất</h4>
                    <p>{data && data.length > 0 && data[0].TagName}</p>
                    <span>{data && data.length > 0 && data[0].ErrorRate}% sai</span>
                </div>
                <div className="stat-card stat-low">
                    <h4>🟢 Tag Dễ Nhất</h4>
                    <p>{data && data.length > 0 && data[data.length - 1].TagName}</p>
                    <span>{data && data.length > 0 && data[data.length - 1].ErrorRate}% sai</span>
                </div>
            </div>
        </div>
    );
};

export default ErrorRateChart;

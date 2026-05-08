import React, { useEffect, useMemo, useState } from 'react';
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import axiosClient from '../../api/axiosClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  Title
);

const timeOptions = [5, 10, 20, 30];

const StudentAnalytics = ({ studentId }) => {
  const [progressData, setProgressData] = useState({ labels: [], scores: [] });
  const [skillMap, setSkillMap] = useState(null);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const [progressResults, skillResults] = await Promise.all([
          axiosClient.get('/analysis/student-progress', { params: { studentId, limit } }),
          axiosClient.get('/analysis/student-skill-map', {
            params: { studentId, limit }
          })
        ]);

        setProgressData(progressResults || { labels: [], scores: [] });
        setSkillMap(skillResults || null);
      } catch (fetchError) {
        console.error('Lỗi tải dữ liệu phân tích học sinh:', fetchError);
        setError('Không thể tải dữ liệu biểu đồ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchAnalytics();
    }
  }, [studentId, limit]);

  const lineChartData = useMemo(() => {
    if (!Array.isArray(progressData.labels) || !progressData.labels.length) return null;

    const shortLabels = progressData.labels.map((_, index) => `Đề ${index + 1}`);

    return {
      labels: shortLabels,
      datasets: [
        {
          label: 'Điểm số /10',
          data: progressData.scores.map((score) => Number(score || 0).toFixed(1)),
          fill: true,
          tension: 0.35,
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#1d4ed8',
          pointBorderColor: '#ffffff',
          pointRadius: 5,
          borderWidth: 3,
        }
      ]
    };
  }, [progressData]);

  const radarChartData = useMemo(() => {
    if (!skillMap || !Array.isArray(skillMap.labels) || !skillMap.labels.length) return null;

    return {
      labels: skillMap.labels,
      datasets: [
        {
          label: 'Tỷ lệ chính xác (%)',
          data: skillMap.data.map((value) => Number(value || 0)),
          fill: true,
          backgroundColor: 'rgba(16, 185, 129, 0.25)',
          borderColor: '#10b981',
          pointBackgroundColor: '#047857',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          borderWidth: 2,
        }
      ]
    };
  }, [skillMap]);

  return (
    <section className="mt-12">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col gap-4 md:items-center md:flex-row md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Hành trình học tập của bạn</h2>
            <p className="text-gray-500 mt-2">
              Biểu đồ tiến độ và bản đồ năng lực được tổng hợp từ {limit} đề thi gần nhất.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {timeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLimit(option)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${limit === option ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {option} đề gần nhất
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-center text-slate-500">Đang tải biểu đồ...</div>
        ) : error ? (
          <div className="mt-8 rounded-3xl bg-rose-50 border border-rose-100 p-6 text-rose-700">{error}</div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-slate-50 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Tiến độ điểm số</h3>
                  <p className="text-sm text-slate-500">Đường tiến bộ của bạn qua các đề gần nhất.</p>
                </div>
                <div className="text-sm text-slate-600">{progressData.labels.length} lần thi</div>
              </div>
              {lineChartData ? (
                <div className="h-[260px] lg:h-[280px]">
                  <Line
                    data={lineChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      aspectRatio: 2.2,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const examLabel = progressData.labels?.[context.dataIndex] || '';
                              return `${context.parsed.y}/10${examLabel ? ` (${examLabel})` : ''}`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: '#475569',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 8
                          },
                          grid: { display: false }
                        },
                        y: {
                          min: 0,
                          max: 10,
                          ticks: {
                            stepSize: 1,
                            callback: (value) => `${value}/10`,
                            color: '#475569'
                          },
                          grid: {
                            color: 'rgba(148, 163, 184, 0.2)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500">Chưa có dữ liệu điểm số.</div>
              )}
            </div>

            <div className="bg-slate-50 rounded-3xl p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Bản đồ năng lực</h3>
                <p className="text-sm text-slate-500">Tỷ lệ chính xác theo tag kỹ năng.</p>
              </div>
              {radarChartData ? (
                <div className="h-[420px]">
                  <Radar
                    data={radarChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          min: 0,
                          max: 100,
                          ticks: {
                            stepSize: 20,
                            callback: (value) => `${value}%`,
                            color: '#475569'
                          },
                          grid: { color: 'rgba(148, 163, 184, 0.2)' },
                          angleLines: { color: 'rgba(148, 163, 184, 0.3)' },
                          pointLabels: { color: '#334155', font: { size: 12 } }
                        }
                      },
                      plugins: {
                        legend: { position: 'top' }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500">Chưa có dữ liệu năng lực.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StudentAnalytics;

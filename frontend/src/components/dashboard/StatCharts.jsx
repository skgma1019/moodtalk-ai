import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const palette = ['#8b2cff', '#ff2f92', '#6a5cff', '#ff8a5b', '#4c82ff', '#a44de0', '#ff6ec7', '#8aa0ff'];

export default function StatCharts({ stats }) {
  const hasData = stats.frequency.length > 0 || stats.categories.length > 0 || stats.trend.length > 0;

  if (!hasData) {
    return (
      <section className="card analytics-card empty-analytics">
        <div className="empty-analytics__icon">♡</div>
        <h3>아직 오늘의 기록이 없습니다</h3>
        <p>첫 감정 기록을 남겨보세요.</p>
      </section>
    );
  }

  const categoryData = {
    labels: stats.categories.map((item) => item.category),
    datasets: [
      {
        label: '카테고리별 기록 수',
        data: stats.categories.map((item) => item.count),
        backgroundColor: palette,
        borderRadius: 14,
      },
    ],
  };

  const frequencyData = {
    labels: stats.frequency.map((item) => item.emotion),
    datasets: [
      {
        label: '감정 횟수',
        data: stats.frequency.map((item) => item.count),
        backgroundColor: palette,
        borderRadius: 12,
      },
    ],
  };

  const ratioData = {
    labels: stats.frequency.map((item) => `${item.emotion} ${item.percentage}%`),
    datasets: [
      {
        data: stats.frequency.map((item) => item.count),
        backgroundColor: palette,
        borderWidth: 0,
      },
    ],
  };

  const trendData = {
    labels: stats.trend.map((item) =>
      new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(item.date)),
    ),
    datasets: [
      {
        label: '기록 수',
        data: stats.trend.map((item) => item.count),
        borderColor: '#8b2cff',
        backgroundColor: 'rgba(139, 44, 255, 0.14)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: '평균 강도',
        data: stats.trend.map((item) => item.averageIntensity),
        borderColor: '#ff2f92',
        backgroundColor: 'rgba(255, 47, 146, 0.1)',
        tension: 0.35,
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <section className="card analytics-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Analytics</p>
          <h2>감정 통계</h2>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-panel chart-panel-wide">
          <h3>감정 카테고리 분포</h3>
          <Bar
            data={categoryData}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    afterBody: (items) => {
                      const details = stats.categories[items[0]?.dataIndex]?.emotions ?? [];
                      return details.length > 0 ? [`세부 감정: ${details.join(', ')}`] : ['세부 감정: 없음'];
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0 },
                },
              },
            }}
          />
        </div>

        <div className="chart-panel">
          <h3>감정별 빈도</h3>
          <Bar
            data={frequencyData}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            }}
          />
        </div>

        <div className="chart-panel">
          <h3>감정 비율</h3>
          <Doughnut
            data={ratioData}
            options={{ cutout: '62%', plugins: { legend: { position: 'bottom' } } }}
          />
        </div>

        <div className="chart-panel chart-panel-wide">
          <h3>최근 감정 흐름</h3>
          <Line
            data={trendData}
            options={{
              interaction: { mode: 'index', intersect: false },
              scales: {
                y: { beginAtZero: true, position: 'left', ticks: { precision: 0 } },
                y1: {
                  beginAtZero: true,
                  position: 'right',
                  max: 10,
                  grid: { drawOnChartArea: false },
                },
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}

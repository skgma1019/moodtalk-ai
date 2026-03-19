import StatCharts from '../components/dashboard/StatCharts.jsx';
import { useEmotionDashboard } from '../hooks/useEmotionDashboard.js';

export default function DashboardPage() {
  const { loading, todaySummary, stats, emotions } = useEmotionDashboard();

  if (loading) {
    return <div className="card empty-state">대시보드를 불러오는 중...</div>;
  }

  return (
    <>
      <section className="card today-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Today</p>
            <h2>오늘의 감정 총정리</h2>
          </div>
          <span className="badge">{emotions.length}개의 기록</span>
        </div>
        <div className="summary-output">
          {todaySummary || '오늘의 감정 기록이 쌓이면 AI가 하루 전체를 정리해드릴게요.'}
        </div>
      </section>
      <StatCharts stats={stats} />
    </>
  );
}

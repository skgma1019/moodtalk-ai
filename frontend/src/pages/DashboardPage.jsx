import { Navigate } from 'react-router-dom';
import StatCharts from '../components/dashboard/StatCharts.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEmotionDashboard } from '../hooks/useEmotionDashboard.js';

export default function DashboardPage() {
  const { token } = useAuth();
  const { loading, todaySummary, stats, emotions } = useEmotionDashboard();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  if (loading) {
    return <div className="card empty-state">대시보드를 불러오는 중...</div>;
  }

  const topCategory = stats.categories[0];
  const topEmotion = stats.frequency[0];

  return (
    <>
      <section className="page-header card">
        <div>
          <p className="section-kicker">Dashboard</p>
          <h2>감정 대시보드</h2>
        </div>
        <p className="page-description">
          오늘의 전체 흐름과 최근 감정 패턴을 먼저 보여주는 화면입니다.
        </p>
      </section>

      <section className="insight-grid full-span">
        <article className="card insight-card">
          <p className="section-kicker">Today</p>
          <h3>오늘 기록 수</h3>
          <strong className="insight-value">{emotions.length}</strong>
          <span className="insight-caption">오늘 남긴 감정 기록의 총 개수</span>
        </article>

        <article className="card insight-card">
          <p className="section-kicker">Top Category</p>
          <h3>가장 많이 나온 카테고리</h3>
          <strong className="insight-value">{topCategory?.category ?? '-'}</strong>
          <span className="insight-caption">
            {topCategory ? `${topCategory.count}회 기록됨` : '아직 데이터가 없어요'}
          </span>
        </article>

        <article className="card insight-card">
          <p className="section-kicker">Top Emotion</p>
          <h3>가장 자주 나온 세부 감정</h3>
          <strong className="insight-value">{topEmotion?.emotion ?? '-'}</strong>
          <span className="insight-caption">
            {topEmotion ? `${topEmotion.count}회 기록됨` : '아직 데이터가 없어요'}
          </span>
        </article>
      </section>

      <section className="card today-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Today Summary</p>
            <h2>오늘의 감정 총정리</h2>
          </div>
          <span className="badge">AI Summary</span>
        </div>
        <div className={`summary-output ${todaySummary ? '' : 'muted-box'}`}>
          {todaySummary || '오늘의 감정 기록이 쌓이면 AI가 하루 전체를 정리해드릴게요.'}
        </div>
      </section>

      <StatCharts stats={stats} />
    </>
  );
}

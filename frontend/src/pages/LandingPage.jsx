import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const featureCards = [
  {
    icon: '♡',
    title: '감정 기록',
    description: '텍스트 입력으로 간편하게 오늘의 감정을 기록하세요.',
  },
  {
    icon: '🎙',
    title: '음성 입력',
    description: '음성으로 말하면 자동으로 텍스트로 변환하고 분석합니다.',
  },
  {
    icon: '📊',
    title: 'AI 분석',
    description: '감정을 자동으로 분류하고 패턴을 찾을 수 있어요.',
  },
  {
    icon: '▦',
    title: '대시보드',
    description: '통계와 그래프로 감정 변화를 한눈에 확인하세요.',
  },
];

const steps = [
  {
    step: '1',
    title: '회원가입',
    description: '간단한 정보 입력만으로 바로 시작할 수 있어요.',
  },
  {
    step: '2',
    title: '감정 기록',
    description: '텍스트나 음성으로 오늘의 감정을 자유롭게 남겨보세요.',
  },
  {
    step: '3',
    title: '분석 확인',
    description: 'AI 분석 결과를 대시보드에서 확인해보세요.',
  },
];

export default function LandingPage() {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <section className="landing-intro card full-span">
        <p className="landing-kicker">MoodTalk AI</p>
        <h2>오늘의 감정을 기록하세요</h2>
        <p className="landing-copy">
          텍스트나 음성으로 간편하게 감정을 기록하고, AI가 분석한 결과를 대시보드에서 확인하세요.
        </p>
        <div className="landing-actions">
          <Link className="primary-button" to="/signup">
            무료로 시작하기
          </Link>
          <Link className="ghost-button" to="/login">
            로그인
          </Link>
        </div>
      </section>

      <section className="feature-grid full-span">
        {featureCards.map((card) => (
          <article key={card.title} className="card feature-card">
            <div className="feature-icon">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="card steps-card full-span">
        <div className="section-head centered-head">
          <div>
            <h2>간단한 3단계</h2>
          </div>
        </div>

        <div className="step-grid">
          {steps.map((step) => (
            <article key={step.step} className="step-card">
              <div className="step-badge">{step.step}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

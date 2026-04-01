import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm.jsx';
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
    description: '말로 남기면 자동으로 텍스트로 정리하고 분석합니다.',
  },
  {
    icon: '📊',
    title: 'AI 분석',
    description: '감정을 자동으로 분류하고 패턴을 찾아드려요.',
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

export default function AuthPage({ mode = 'login' }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = mode === 'signup';
  const successMessage = location.state?.message;

  const handleLogin = async (payload, form) => {
    await login(payload);
    form.reset();
    navigate('/dashboard');
  };

  const handleSignup = async (payload, form) => {
    await signup(payload);
    form.reset();
    navigate('/auth/login', {
      replace: true,
      state: {
        message: '회원가입이 완료되었습니다. 이제 로그인해 주세요.',
      },
    });
  };

  return (
    <>
      <section className="landing-intro card full-span">
        <p className="landing-kicker">MoodTalk AI</p>
        <h2>오늘의 감정을 기록하세요</h2>
        <p className="landing-copy">
          텍스트나 음성으로 간편하게 감정을 기록하고, AI가 분석한 결과를 대시보드에서 확인하세요.
        </p>
        <div className="landing-actions">
          <Link className="primary-button" to="/auth/signup">
            무료로 시작하기
          </Link>
          <Link className="ghost-button" to="/auth/login">
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

      {successMessage && !isSignup ? (
        <section className="card full-span auth-notice">
          {successMessage}
        </section>
      ) : null}

      <section className="auth-layout full-span">
        <AuthForm
          title={isSignup ? '회원가입' : '로그인'}
          buttonText={isSignup ? '회원가입 완료' : '로그인'}
          helperText={
            isSignup
              ? '닉네임, 이메일, 비밀번호를 입력하면 새 계정을 만들 수 있어요.'
              : '이메일과 비밀번호를 입력하면 바로 서비스를 시작할 수 있어요.'
          }
          onSubmit={isSignup ? handleSignup : handleLogin}
          footer={(
            <p className="auth-switch">
              {isSignup ? '이미 계정이 있나요?' : '처음 오셨나요?'}{' '}
              <Link to={isSignup ? '/auth/login' : '/auth/signup'}>
                {isSignup ? '로그인으로 이동' : '회원가입으로 이동'}
              </Link>
            </p>
          )}
          fields={
            isSignup
              ? [
                  { name: 'nickname', label: '닉네임', type: 'text', placeholder: '예: 은찬' },
                  { name: 'email', label: '이메일', type: 'email', placeholder: 'you@example.com' },
                  { name: 'password', label: '비밀번호', type: 'password', placeholder: '6자 이상', minLength: 6 },
                ]
              : [
                  { name: 'email', label: '이메일', type: 'email', placeholder: 'you@example.com' },
                  { name: 'password', label: '비밀번호', type: 'password', placeholder: '비밀번호 입력' },
                ]
          }
        />
      </section>
    </>
  );
}

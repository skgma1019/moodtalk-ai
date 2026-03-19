import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (payload, form) => {
    await login(payload);
    form.reset();
    navigate('/dashboard');
  };

  const handleSignup = async (payload, form) => {
    await signup(payload);
    form.reset();
    navigate('/dashboard');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Mood Journal + AI Reflection</p>
          <h1>MoodTalk AI</h1>
          <p className="hero-text">프론트를 React로 분리하고, 인증 화면과 감정 기록 화면, 대시보드 화면을 각각 나눴습니다.</p>
        </div>
        <div className="hero-panel">
          <p>Structure</p>
          <h2>Auth, Record, Dashboard</h2>
          <span>이제 화면이 역할별로 나뉘어 관리됩니다.</span>
        </div>
      </header>
      <section className="auth-layout">
        <AuthForm
          title="회원가입"
          buttonText="회원가입 후 시작하기"
          onSubmit={handleSignup}
          fields={[
            { name: 'nickname', label: '닉네임', type: 'text', placeholder: '예: 민지' },
            { name: 'email', label: '이메일', type: 'email', placeholder: 'you@example.com' },
            { name: 'password', label: '비밀번호', type: 'password', placeholder: '6자 이상', minLength: 6 },
          ]}
        />
        <AuthForm
          title="로그인"
          buttonText="로그인"
          onSubmit={handleLogin}
          fields={[
            { name: 'email', label: '이메일', type: 'email', placeholder: 'you@example.com' },
            { name: 'password', label: '비밀번호', type: 'password', placeholder: '비밀번호 입력' },
          ]}
        />
      </section>
    </div>
  );
}

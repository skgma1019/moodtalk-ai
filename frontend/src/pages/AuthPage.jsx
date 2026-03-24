import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

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
      <section className="page-header card full-span">
        <div>
          <p className="section-kicker">Auth</p>
          <h2>{isSignup ? '회원가입' : '로그인'}</h2>
        </div>
        <p className="page-description">
          {isSignup
            ? '처음이라면 계정을 만든 뒤 로그인해서 서비스를 시작할 수 있습니다.'
            : '이미 계정이 있다면 로그인해서 감정 기록과 대시보드를 이용하세요.'}
        </p>
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
              : '이메일과 비밀번호를 입력하면 바로 대시보드로 이동합니다.'
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
                  { name: 'nickname', label: '닉네임', type: 'text', placeholder: '예: 민지' },
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

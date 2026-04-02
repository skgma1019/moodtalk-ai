import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { showErrorAlert } from '../utils/alerts.js';

export default function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (payload, form) => {
    try {
      await login(payload);
      form.reset();
      navigate('/dashboard');
    } catch (error) {
      showErrorAlert(error, '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <section className="auth-page-shell">
      {location.state?.message ? (
        <section className="card auth-notice">
          {location.state.message}
        </section>
      ) : null}

      <AuthForm
        title="로그인"
        buttonText="로그인"
        helperText="이메일과 비밀번호를 입력하면 바로 서비스를 시작할 수 있어요."
        onSubmit={handleLogin}
        footer={(
          <p className="auth-switch">
            처음 오셨나요? <Link to="/signup">회원가입으로 이동</Link>
          </p>
        )}
        fields={[
          { name: 'email', label: '이메일', type: 'email', placeholder: 'you@example.com' },
          { name: 'password', label: '비밀번호', type: 'password', placeholder: '비밀번호 입력' },
        ]}
      />
    </section>
  );
}

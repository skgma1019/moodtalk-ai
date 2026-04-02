import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { showErrorAlert } from '../utils/alerts.js';

export default function SignupPage() {
  const { signup, token } = useAuth();
  const navigate = useNavigate();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignup = async (payload, form) => {
    try {
      await signup(payload);
      form.reset();
      navigate('/login', {
        replace: true,
        state: {
          message: '회원가입이 완료되었습니다. 이제 로그인해 주세요.',
        },
      });
    } catch (error) {
      showErrorAlert(error, '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <section className="auth-page-shell">
      <AuthForm
        title="회원가입"
        buttonText="회원가입 완료"
        helperText="닉네임, 이메일, 비밀번호를 입력하면 새 계정을 만들 수 있어요."
        onSubmit={handleSignup}
        footer={(
          <p className="auth-switch">
            이미 계정이 있나요? <Link to="/login">로그인으로 이동</Link>
          </p>
        )}
        fields={[
          { name: 'nickname', label: '닉네임', type: 'text', placeholder: '예: 은찬' },
          { name: 'email', label: '이메일', type: 'email', placeholder: 'you@example.com' },
          { name: 'password', label: '비밀번호', type: 'password', placeholder: '6자 이상', minLength: 6 },
        ]}
      />
    </section>
  );
}

import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AppLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');

  const handleAuthClick = () => {
    if (token) {
      logout();
      navigate('/auth/login');
      return;
    }

    navigate('/auth/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Mood Journal + AI Reflection</p>
          <h1 className="brand-title">MoodTalk AI</h1>
        </div>

        <nav className="topnav">
          <NavLink to="/record" className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}>
            감정기록
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}>
            대시보드
          </NavLink>
          <button type="button" className="topnav-link auth-action" onClick={handleAuthClick}>
            {token ? '로그아웃' : '로그인'}
          </button>
        </nav>
      </header>

      {!isAuthPage ? (
        <section className="hero hero-compact">
          <div className="hero-copy">
            <p className="eyebrow">Welcome</p>
            <h2 className="hero-heading">
              {token ? `${user?.nickname}님의 감정 흐름을 차분하게 살펴볼 시간이에요.` : '로그인하고 감정 기록을 시작해보세요.'}
            </h2>
            <p className="hero-text">
              {token
                ? '감정 기록 화면에서 메모를 남기고, 대시보드에서 하루 요약과 통계를 바로 확인할 수 있습니다.'
                : '로그인하면 감정 기록, AI 요약, 대시보드를 모두 사용할 수 있습니다.'}
            </p>
          </div>
          <div className="hero-panel">
            <p>현재 상태</p>
            <h2>{token ? '로그인 완료' : '로그인 필요'}</h2>
            <span>{token ? user?.email : '상단 오른쪽 로그인 버튼으로 바로 이동할 수 있어요.'}</span>
          </div>
        </section>
      ) : null}

      <main className={isAuthPage ? 'auth-main' : 'dashboard'}>
        <Outlet />
      </main>
    </div>
  );
}

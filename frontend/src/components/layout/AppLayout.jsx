import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

function getHeroContent(pathname, user) {
  if (pathname.startsWith('/record')) {
    return {
      title: `안녕하세요, ${user?.nickname ?? '사용자'}님!`,
      description: '오늘 하루는 어떠셨나요? 감정을 기록하고 분석해보세요.',
    };
  }

  if (pathname.startsWith('/dashboard')) {
    return {
      title: `안녕하세요, ${user?.nickname ?? '사용자'}님!`,
      description: '오늘의 감정 분석 결과를 한눈에 확인해보세요.',
    };
  }

  return {
    title: '당신의 감정을 기록하고 이해하세요',
    description: 'AI 기반 감정 분석으로 마음의 패턴을 발견하고 더 나은 하루를 만들어보세요.',
  };
}

export default function AppLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');
  const hero = getHeroContent(location.pathname, user);

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
        <button type="button" className="brand-link" onClick={() => navigate(token ? '/dashboard' : '/auth/login')}>
          <span className="brand-mark">♥</span>
          <span className="brand-name">감정일기</span>
        </button>

        <nav className="topnav">
          {token ? (
            <>
              <NavLink to="/record" className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}>
                ♡ 감정 기록
              </NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}>
                ▦ 대시보드
              </NavLink>
              <button type="button" className="topnav-link auth-action" onClick={handleAuthClick}>
                ⇢ 로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/auth/login" className={({ isActive }) => `topnav-link text-link ${isActive ? 'active' : ''}`}>
                로그인
              </NavLink>
              <NavLink to="/auth/signup" className={({ isActive }) => `topnav-link signup-link ${isActive ? 'active' : ''}`}>
                회원가입
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <section className="hero-banner">
        <div className="hero-banner__inner">
          <div className="hero-banner__copy">
            <h1>{hero.title}</h1>
            <p>{hero.description}</p>
          </div>
          <div className="hero-banner__badge">{token ? '👋' : '💭'}</div>
        </div>
      </section>

      <main className={isAuthPage ? 'auth-main' : 'dashboard'}>
        <Outlet />
      </main>
    </div>
  );
}

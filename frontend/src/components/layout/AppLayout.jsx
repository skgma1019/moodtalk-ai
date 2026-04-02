import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

function getHeroContent(pathname, user, token) {
  if (!token && pathname === '/login') {
    return {
      title: '다시 만나서 반가워요',
      description: '로그인하고 오늘의 감정을 기록해보세요.',
      badge: '🔐',
    };
  }

  if (!token && pathname === '/signup') {
    return {
      title: '오늘부터 감정 기록을 시작해보세요',
      description: '회원가입 후 감정 기록, AI 분석, 대시보드를 모두 이용할 수 있어요.',
      badge: '✨',
    };
  }

  if (pathname.startsWith('/record')) {
    return {
      title: `안녕하세요, ${user?.nickname ?? '사용자'}님!`,
      description: '오늘 하루는 어떠셨나요? 감정을 기록하고 분석해보세요.',
      badge: '👋',
    };
  }

  if (pathname.startsWith('/dashboard')) {
    return {
      title: `안녕하세요, ${user?.nickname ?? '사용자'}님!`,
      description: '오늘의 감정 분석 결과를 한눈에 확인해보세요.',
      badge: '💭',
    };
  }

  return {
    title: '당신의 감정을 기록하고 이해하세요',
    description: 'AI 기반 감정 분석으로 마음의 패턴을 발견하고 더 나은 하루를 만들어보세요.',
    badge: '💗',
  };
}

export default function AppLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const hero = getHeroContent(location.pathname, user, token);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand-link" onClick={() => navigate(token ? '/dashboard' : '/')}>
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
              <button type="button" className="topnav-link auth-action" onClick={handleLogout}>
                ⇢ 로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `topnav-link text-link ${isActive ? 'active' : ''}`}>
                로그인
              </NavLink>
              <NavLink to="/signup" className={({ isActive }) => `topnav-link signup-link ${isActive ? 'active' : ''}`}>
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
          <div className="hero-banner__badge">{hero.badge}</div>
        </div>
      </section>

      <main className={isAuthPage ? 'auth-main' : 'dashboard'}>
        <Outlet />
      </main>
    </div>
  );
}

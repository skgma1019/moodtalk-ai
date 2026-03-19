import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Mood Journal + AI Reflection</p>
          <h1>MoodTalk AI</h1>
          <p className="hero-text">{user?.nickname}님의 감정 기록을 React 화면으로 분리해 정리해드릴게요.</p>
        </div>
        <div className="hero-panel">
          <p>Navigation</p>
          <nav className="nav-links">
            <NavLink to="/record" className="nav-link">감정 기록</NavLink>
            <NavLink to="/dashboard" className="nav-link">대시보드</NavLink>
            <button type="button" className="ghost-button nav-link" onClick={handleLogout}>로그아웃</button>
          </nav>
          <span>{user?.email}</span>
        </div>
      </header>
      <main className="dashboard">
        <Outlet />
      </main>
    </div>
  );
}

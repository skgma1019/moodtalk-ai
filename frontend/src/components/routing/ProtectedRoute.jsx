import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="screen-message">불러오는 중...</div>;
  }

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}

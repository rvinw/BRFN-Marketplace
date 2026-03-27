import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// allowedRoles: array of roles that can access this route, e.g. ['producer', 'admin']
// If allowedRoles is omitted, any logged-in user can access it
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
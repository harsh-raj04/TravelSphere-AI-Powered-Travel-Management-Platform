import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RoleRoute({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
        <div className="w-8 h-8 border-4 border-light-border dark:border-dark-border border-t-brand-primary dark:border-t-brand-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/dashboard'} replace />;
  }

  return children;
}

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getHomeRouteForRole, hasAllowedRole, isRoleAllowedForVariant } from '../utils/roleRouting';

export function RoleRoute({ allowedRoles = [], children }) {
  const { user, loading, variant } = useAuth();
  const variantLoginRoute =
    variant === 'admin' ? '/admin/login' : variant === 'agent' ? '/agent/login' : '/login';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
        <div className="w-8 h-8 border-4 border-light-border dark:border-dark-border border-t-brand-primary dark:border-t-brand-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={variantLoginRoute} replace />;
  }

  if (!isRoleAllowedForVariant(user.role, variant)) {
    return <Navigate to={variantLoginRoute} replace />;
  }

  if (!hasAllowedRole(user.role, allowedRoles)) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }

  return children;
}

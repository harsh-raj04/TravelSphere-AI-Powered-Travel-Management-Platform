import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Check if JWT token is expired
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (err) {
    console.error('[ProtectedRoute] Failed to parse token:', err);
    return true; // Treat parsing errors as expired
  }
}

export function ProtectedRoute({ children }) {
  const { user, loading, logout } = useAuth();
  const token = sessionStorage.getItem('authToken');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-light-border dark:border-dark-border border-t-brand-primary dark:border-t-brand-secondary rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Loading your travel experiences...</p>
        </div>
      </div>
    );
  }

  // Check if token is expired
  if (token && isTokenExpired(token)) {
    console.log('[ProtectedRoute] Token expired - logging out');
    logout();
    return <Navigate to="/login" replace />;
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

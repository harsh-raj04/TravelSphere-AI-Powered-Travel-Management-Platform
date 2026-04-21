import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to validate JWT token and handle expiration
 * - Checks token validity on component mount
 * - Redirects to login if token is expired
 * - Can be used on any protected page for extra validation
 */
export function useTokenValidation() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= expirationTime) {
        console.log('[useTokenValidation] Token expired');
        logout();
        navigate('/login', { replace: true });
      }
    } catch (err) {
      console.error('[useTokenValidation] Failed to validate token:', err);
      logout();
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);
}

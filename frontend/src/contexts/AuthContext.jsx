import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

/**
 * isTokenExpired: Check if JWT token is expired
 * JWT format: header.payload.signature
 * Payload contains 'exp' (expiration timestamp in seconds)
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (err) {
    console.error('[Auth] Failed to parse token:', err);
    return true; // Treat parsing errors as expired token
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  // Clear token and user on expiration
  const clearAuth = useCallback(() => {
    console.log('[Auth] Clearing authentication');
    sessionStorage.removeItem('authToken');
    setUser(null);
    if (sessionTimeout) clearTimeout(sessionTimeout);
  }, [sessionTimeout]);

  // Initialize auth on app load
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    
    if (token) {
      // Check if token is already expired
      if (isTokenExpired(token)) {
        console.log('[Auth] Token expired on app load');
        clearAuth();
        setLoading(false);
        return;
      }

      // Validate token with backend
      authAPI
        .me()
        .then((res) => {
          console.log('[Auth] Token validated successfully');
          setUser(res.data.data.user);
          setupSessionTimeout(token);
        })
        .catch((err) => {
          console.log('[Auth] Token validation failed:', err.message);
          clearAuth();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Setup session timeout based on token expiration
  const setupSessionTimeout = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const timeUntilExpiry = expirationTime - Date.now();

      if (timeUntilExpiry > 0) {
        // Set timeout to logout 1 minute before actual expiration
        const logoutTime = Math.max(timeUntilExpiry - 60000, 0);
        console.log(`[Auth] Session will expire in ${Math.floor(logoutTime / 1000)} seconds`);
        
        const timeout = setTimeout(() => {
          console.log('[Auth] Session expired - logging out');
          clearAuth();
        }, logoutTime);

        setSessionTimeout(timeout);
      }
    } catch (err) {
      console.error('[Auth] Failed to setup session timeout:', err);
    }
  }, [clearAuth]);

  const login = useCallback((token, userData) => {
    console.log('[Auth] Logging in user:', userData.email);
    // Use sessionStorage instead of localStorage - cleared when tab closes
    sessionStorage.setItem('authToken', token);
    setUser(userData);
    setupSessionTimeout(token);
  }, [setupSessionTimeout]);

  const logout = useCallback(() => {
    console.log('[Auth] User initiated logout');
    clearAuth();
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { isRoleAllowedForVariant, normalizeRole } from '../utils/roleRouting';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const variant = (import.meta.env.VITE_APP_VARIANT || 'customer').toLowerCase();

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      authAPI
        .me()
        .then((res) => {
          const nextUser = res.data.data.user;
          if (!isRoleAllowedForVariant(nextUser?.role, variant)) {
            sessionStorage.removeItem('authToken');
            setUser(null);
            return;
          }

          setUser({
            ...nextUser,
            role: normalizeRole(nextUser?.role),
          });
        })
        .catch(() => sessionStorage.removeItem('authToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    if (!isRoleAllowedForVariant(userData?.role, variant)) {
      sessionStorage.removeItem('authToken');
      setUser(null);
      return false;
    }

    sessionStorage.setItem('authToken', token);
    setUser({
      ...userData,
      role: normalizeRole(userData?.role),
    });

    return true;
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, variant }}>
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

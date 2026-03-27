import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const res = await authAPI.login(form);
      const nextUser = res.data.data.user;
      login(res.data.data.token, nextUser);
      navigate(nextUser?.role === 'agent' ? '/agent/dashboard' : '/dashboard');
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-dark-bg-primary dark:via-dark-bg-secondary dark:to-dark-bg-primary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Continue your travel journey
          </p>
        </div>

        <Card variant="elevated" className="p-8 space-y-6">
          {/* API Error */}
          {apiError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary transition ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-light-border dark:border-dark-border focus:border-brand-primary focus:ring-brand-primary/20'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                  placeholder="••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary transition ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-light-border dark:border-dark-border focus:border-brand-primary focus:ring-brand-primary/20'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.password && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              className="mt-6"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">Demo Credentials</p>
            <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
              customer@travelsphere.dev
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
              Password123
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Don't have an account?{' '}
            <a href="/register" className="font-semibold text-brand-primary hover:text-brand-secondary transition">
              Sign up here
            </a>
          </div>

          <div className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Agent account?{' '}
            <a href="/agent/login" className="font-semibold text-brand-primary hover:text-brand-secondary transition">
              Open Agent Login
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

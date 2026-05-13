import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Mail, Lock, User, AlertCircle, Check } from 'lucide-react';

export function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
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
      const res = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'customer',
      });
      login(res.data.data.token, res.data.data.user);
      navigate('/home');
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="travel-ui min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Start exploring amazing travel packages
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
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setErrors({ ...errors, name: '' });
                  }}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary transition ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-light-border dark:border-dark-border focus:border-brand-primary focus:ring-brand-primary/20'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>}
            </div>

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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => {
                    setForm({ ...form, confirmPassword: e.target.value });
                    setErrors({ ...errors, confirmPassword: '' });
                  }}
                  placeholder="••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary transition ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-light-border dark:border-dark-border focus:border-brand-primary focus:ring-brand-primary/20'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>}
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-brand-primary hover:text-brand-secondary transition">
              Login here
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

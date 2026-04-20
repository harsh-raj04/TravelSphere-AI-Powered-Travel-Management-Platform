import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import { normalizeRole } from '../utils/roleRouting';

export function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setApiError('');

    try {
      const res = await authAPI.login(form);
      const nextUser = res.data.data.user;

      if (normalizeRole(nextUser?.role) !== 'admin') {
        setApiError('This portal is only for admin accounts.');
        setLoading(false);
        return;
      }

      const didLogin = login(res.data.data.token, nextUser);
      if (!didLogin) {
        setApiError('This portal is only for admin accounts.');
        setLoading(false);
        return;
      }

      navigate('/admin/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Admin Portal</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Sign in for platform control and operations</p>
        </div>

        <Card variant="elevated" className="p-8 space-y-6">
          {apiError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="admin@travelsphere.dev"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? 'Logging in...' : 'Login as Admin'}
            </Button>
          </form>

          <div className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Back to{' '}
            <Link to="/" className="font-semibold text-brand-primary hover:text-brand-secondary transition">
              admin home
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

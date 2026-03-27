import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Mail, Lock, AlertCircle, Briefcase } from 'lucide-react';

export function AgentLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');

    try {
      const res = await authAPI.login(form);
      const nextUser = res.data.data.user;

      if (nextUser?.role !== 'agent') {
        setApiError('This portal is only for agent accounts. Please use customer login.');
        setLoading(false);
        return;
      }

      login(res.data.data.token, nextUser);
      navigate('/agent/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-fuchsia-50 dark:from-dark-bg-primary dark:via-dark-bg-secondary dark:to-dark-bg-primary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Agent Portal</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Login to manage packages and bookings</p>
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
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Agent Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="agent@travelsphere.dev"
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
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? 'Logging in...' : 'Login as Agent'}
            </Button>
          </form>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Agent Demo Credentials</p>
            <p className="text-xs text-indigo-800 dark:text-indigo-200 font-mono">agent@travelsphere.dev</p>
            <p className="text-xs text-indigo-800 dark:text-indigo-200 font-mono">Password123</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Plane } from 'lucide-react';
import { getHomeRouteForRole, isRoleAllowedForVariant } from '../utils/roleRouting';
import { AuthLayout } from '../components/auth/AuthLayout';

function InputField({ id, type, value, onChange, placeholder, icon: Icon, error, label, rightElement }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" size={18} />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-${rightElement ? '10' : '4'} py-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm ${
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
              : 'border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-teal-500/20'
          } focus:outline-none focus:ring-2`}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const variant = (import.meta.env.VITE_APP_VARIANT || 'customer').toLowerCase();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setApiError('');
    try {
      const res = await authAPI.login(form);
      const nextUser = res.data.data.user;

      if (!isRoleAllowedForVariant(nextUser?.role, variant)) {
        setApiError(`This portal only allows ${variant} accounts.`);
        setLoading(false);
        return;
      }

      const didLogin = login(res.data.data.token, nextUser);
      if (!didLogin) {
        setApiError(`This portal only allows ${variant} accounts.`);
        setLoading(false);
        return;
      }

      navigate(getHomeRouteForRole(nextUser?.role));
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="login">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
          <Plane className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-lg leading-none">TravelSphere</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your travel companion</p>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1.5">Welcome back</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Continue your travel journey</p>
      </div>

      {/* API error */}
      {apiError && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-2.5 items-start">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          id="login-email"
          type="email"
          label="Email Address"
          value={form.email}
          onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email}
        />

        <InputField
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={form.password}
          onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
          placeholder="••••••••"
          icon={Lock}
          error={errors.password}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <div className="flex justify-end -mt-1">
          <a href="/forgot-password" className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-sm transition-all shadow-md hover:shadow-teal-500/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : 'Sign In'}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-6 space-y-3">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <a href="/register" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            Sign up free
          </a>
        </p>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-400 flex-shrink-0">or</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Agent account?{' '}
          <a href="/agent/login" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:underline transition-colors">
            Agent Login →
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}

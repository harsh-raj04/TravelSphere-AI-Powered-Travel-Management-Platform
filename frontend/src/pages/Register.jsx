import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Plane, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';

function InputField({ id, type, value, onChange, placeholder, icon: Icon, error, label, rightElement }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-10 ${rightElement ? 'pr-10' : 'pr-4'} py-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm ${
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

function OtpInput({ value, onChange }) {
  const inputs = useRef([]);

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = digit;
    const next = arr.join('');
    onChange(next);
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const nextEmpty = Math.min(pasted.length, 5);
    inputs.current[nextEmpty]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
          style={{ height: '52px' }}
        />
      ))}
    </div>
  );
}

const PERKS = [
  'Access 500+ curated travel packages',
  'Track all your bookings in one place',
  'Chat with expert travel agents',
];

export function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters required';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown(s => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setApiError('');
    try {
      await authAPI.sendRegistrationOtp(form.email);
      setStep(2);
      setOtp('');
      startResendCooldown();
    } catch (err) {
      const issues = err.response?.data?.errors;
      if (issues?.length) {
        const fieldErr = issues.find(i => i.field === 'email');
        if (fieldErr) setErrors({ email: fieldErr.issue });
        else setApiError(issues[0].issue || err.response?.data?.message);
      } else {
        setApiError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setApiError('');
    try {
      await authAPI.sendRegistrationOtp(form.email);
      setOtp('');
      startResendCooldown();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setApiError('Please enter the complete 6-digit code.'); return; }

    setLoading(true);
    setApiError('');
    try {
      const res = await authAPI.verifyAndRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        otp,
      });
      login(res.data.data.token, res.data.data.user);
      navigate('/home');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: '' });
  };

  return (
    <AuthLayout type="signup">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
          <Plane className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-lg leading-none">TravelSphere</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your travel companion</p>
        </div>
      </div>

      {/* Step 1 — Details */}
      {step === 1 && (
        <>
          <div className="mb-5">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1.5">Create account</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Start exploring amazing travel packages</p>
          </div>

          <div className="mb-5 flex flex-col gap-1.5">
            {PERKS.map(p => (
              <div key={p} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-teal-600 dark:text-teal-400" />
                </span>
                {p}
              </div>
            ))}
          </div>

          {apiError && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <InputField id="register-name" type="text" label="Full Name" value={form.name}
              onChange={set('name')} placeholder="John Doe" icon={User} error={errors.name} />
            <InputField id="register-email" type="email" label="Email Address" value={form.email}
              onChange={set('email')} placeholder="you@example.com" icon={Mail} error={errors.email} />
            <InputField id="register-password" type={showPassword ? 'text' : 'password'} label="Password"
              value={form.password} onChange={set('password')} placeholder="Min. 6 characters"
              icon={Lock} error={errors.password}
              rightElement={
                <button type="button" onClick={() => setShowPassword(p => !p)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              } />
            <InputField id="register-confirm" type={showConfirm ? 'text' : 'password'} label="Confirm Password"
              value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password"
              icon={Lock} error={errors.confirmPassword}
              rightElement={
                <button type="button" onClick={() => setShowConfirm(p => !p)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              } />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-sm transition-all shadow-md hover:shadow-teal-500/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending code…
                </span>
              ) : 'Continue — Verify Email'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">Sign in</a>
          </p>
        </>
      )}

      {/* Step 2 — OTP */}
      {step === 2 && (
        <>
          <button
            onClick={() => { setStep(1); setApiError(''); setOtp(''); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Verify your email</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{form.email}</span>
            </p>
          </div>

          {apiError && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center">
                Enter verification code
              </label>
              <OtpInput value={otp} onChange={v => { setOtp(v); setApiError(''); }} />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-sm transition-all shadow-md hover:shadow-teal-500/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className="flex items-center gap-1.5 mx-auto text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline transition-colors"
            >
              <RefreshCw size={14} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

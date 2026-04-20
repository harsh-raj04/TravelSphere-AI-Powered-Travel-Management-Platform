import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Upload } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getHomeRouteForRole } from '../utils/roleRouting';

const CITY_OPTIONS = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Goa',
  'Kochi',
  'Lucknow',
];

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali'];

const TRIP_TYPE_OPTIONS = [
  'Adventure',
  'Luxury',
  'Budget',
  'Honeymoon',
  'Family',
  'Pilgrimage',
  'Corporate',
  'Wildlife',
  'Wellness',
];

const STEPS = ['Personal', 'Professional', 'Capability', 'Review'];

function MultiSelect({ options, values, onToggle, max }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((item) => {
        const active = values.includes(item);
        const disabled = !active && typeof max === 'number' && values.length >= max;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-full border text-sm transition ${
              active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

export function AgentRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    experienceYears: '',
    languagesKnown: [],
    citiesOperated: [],
    tripTypes: [],
    instagram: '',
    website: '',
  });

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const toggleArrayValue = (key, value, max) => {
    setForm((prev) => {
      const list = prev[key];
      const exists = list.includes(value);
      if (exists) {
        return { ...prev, [key]: list.filter((item) => item !== value) };
      }
      if (typeof max === 'number' && list.length >= max) {
        return prev;
      }
      return { ...prev, [key]: [...list, value] };
    });
  };

  const validateStep = () => {
    const nextErrors = {};

    if (step === 0) {
      if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required';
      if (!form.email.trim()) nextErrors.email = 'Email is required';
      if (!form.password) nextErrors.password = 'Password is required';
      if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
      if (!form.phone.trim()) nextErrors.phone = 'Phone number is required';
    }

    if (step === 1) {
      if (!form.city) nextErrors.city = 'Select your primary city';
      if (!form.experienceYears) nextErrors.experienceYears = 'Experience is required';
      if (Number(form.experienceYears) < 0) nextErrors.experienceYears = 'Experience cannot be negative';
      if (form.languagesKnown.length === 0) nextErrors.languagesKnown = 'Choose at least one language';
    }

    if (step === 2) {
      if (form.citiesOperated.length === 0) nextErrors.citiesOperated = 'Select at least one operating city';
      if (form.tripTypes.length === 0) nextErrors.tripTypes = 'Select at least one trip type';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) {
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  };

  const submit = async () => {
    if (!validateStep()) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const res = await authAPI.register({
        name: form.fullName,
        email: form.email,
        password: form.password,
        role: 'agent',
      });

      login(res.data.data.token, res.data.data.user);
      navigate(getHomeRouteForRole(res.data.data.user?.role));
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create agent account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f7ff] via-white to-[#eef8ff] py-10 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Apply as a Travel Agent</h1>
          <p className="text-slate-600 mt-2">Complete your profile in four short steps</p>
        </div>

        <Card variant="elevated" className="p-6 md:p-8 bg-white border border-slate-200">
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Step {step + 1} of {STEPS.length}</span>
              <span>{progress}% complete</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2">
              <div className="h-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {STEPS.map((label, index) => (
                <p
                  key={label}
                  className={`text-xs text-center ${index <= step ? 'text-blue-700 font-semibold' : 'text-slate-400'}`}
                >
                  {label}
                </p>
              ))}
            </div>
          </div>

          {apiError && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                />
                {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Email (OTP verified)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Primary City</label>
                  <select
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select city</option>
                    {CITY_OPTIONS.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={form.experienceYears}
                    onChange={(event) => setForm({ ...form, experienceYears: event.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  {errors.experienceYears && <p className="text-xs text-red-600 mt-1">{errors.experienceYears}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Languages Known</label>
                <div className="mt-2">
                  <MultiSelect
                    options={LANGUAGE_OPTIONS}
                    values={form.languagesKnown}
                    onToggle={(value) => toggleArrayValue('languagesKnown', value)}
                  />
                </div>
                {errors.languagesKnown && <p className="text-xs text-red-600 mt-1">{errors.languagesKnown}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Cities You Operate In</label>
                  <span className="text-xs text-slate-500">{form.citiesOperated.length}/25 selected</span>
                </div>
                <div className="mt-2">
                  <MultiSelect
                    options={CITY_OPTIONS}
                    values={form.citiesOperated}
                    max={25}
                    onToggle={(value) => toggleArrayValue('citiesOperated', value, 25)}
                  />
                </div>
                {errors.citiesOperated && <p className="text-xs text-red-600 mt-1">{errors.citiesOperated}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Trip Types You Handle</label>
                <div className="mt-2">
                  <MultiSelect
                    options={TRIP_TYPE_OPTIONS}
                    values={form.tripTypes}
                    onToggle={(value) => toggleArrayValue('tripTypes', value)}
                  />
                </div>
                {errors.tripTypes && <p className="text-xs text-red-600 mt-1">{errors.tripTypes}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Instagram (optional)</label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(event) => setForm({ ...form, instagram: event.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Website (optional)</label>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(event) => setForm({ ...form, website: event.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="https://youragency.com"
                  />
                </div>
              </div>

              <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 text-slate-700 mb-1">
                  <Upload className="w-4 h-4" />
                  <p className="text-sm font-medium">Upload Documents (UI only)</p>
                </div>
                <p className="text-xs text-slate-500">Aadhaar, PAN, and business proof upload will be enabled in verification phase.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 text-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5" />
                <span>Please confirm your details before creating the agent account.</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">Personal</p>
                  <p className="text-slate-600 mt-1">{form.fullName}</p>
                  <p className="text-slate-600">{form.email}</p>
                  <p className="text-slate-600">{form.phone}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">Professional</p>
                  <p className="text-slate-600 mt-1">City: {form.city || 'Not selected'}</p>
                  <p className="text-slate-600">Experience: {form.experienceYears || '0'} years</p>
                  <p className="text-slate-600">Languages: {form.languagesKnown.join(', ') || 'Not selected'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 md:col-span-2">
                  <p className="font-semibold text-slate-900">Service Capability</p>
                  <p className="text-slate-600 mt-1">Operating cities: {form.citiesOperated.join(', ') || 'Not selected'}</p>
                  <p className="text-slate-600">Trip types: {form.tripTypes.join(', ') || 'Not selected'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between">
            <div>
              {step > 0 ? (
                <Button type="button" variant="secondary" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Link to="/agent/login" className="text-sm text-blue-700 hover:text-blue-800 font-medium">
                  Back to agent login
                </Link>
              )}
            </div>

            <div>
              {step < STEPS.length - 1 ? (
                <Button type="button" variant="primary" onClick={goNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" variant="primary" onClick={submit} disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Agent Account'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

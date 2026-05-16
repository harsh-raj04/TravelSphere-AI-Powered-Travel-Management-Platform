import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { customRequestsAPI } from '../services/api';
import {
  MapPin, Calendar, Users, Wallet, Star, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, Wand2,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Destination', icon: MapPin },
  { id: 2, label: 'Travelers',  icon: Users },
  { id: 3, label: 'Budget',     icon: Wallet },
  { id: 4, label: 'Preferences',icon: Star },
  { id: 5, label: 'Contact',    icon: CheckCircle2 },
];

const TRIP_TYPES = [
  { value: 'group_tours',    label: 'Group Tour',  icon: '👥' },
  { value: 'family_tours',   label: 'Family Tour', icon: '👨‍👩‍👧‍👦' },
  { value: 'couple_tours',   label: 'Honeymoon',   icon: '💑' },
  { value: 'personal_tours', label: 'Solo',        icon: '👤' },
  { value: 'pilgrimage',     label: 'Pilgrimage',  icon: '🕌' },
  { value: 'weekend_trips',  label: 'Weekend',     icon: '🌴' },
];

const BUDGETS = [
  { value: '0-10000',     label: 'Under ₹10,000',   sub: 'Budget-friendly' },
  { value: '10000-25000', label: '₹10k – ₹25k',      sub: 'Mid-range' },
  { value: '25000-50000', label: '₹25k – ₹50k',      sub: 'Premium' },
  { value: '50000-above', label: 'Above ₹50,000',    sub: 'Luxury' },
];

const ACCOMMODATION = [
  { value: 'budget',    label: '🏕️ Budget Stay' },
  { value: 'standard', label: '🏨 Standard Hotel' },
  { value: 'premium',  label: '🏩 Premium Hotel' },
  { value: 'luxury',   label: '🏰 Luxury Resort' },
];

const MEAL_PLANS = [
  { value: 'none',  label: 'No meals' },
  { value: 'cp',   label: 'Breakfast only' },
  { value: 'map',  label: 'Breakfast + Dinner' },
  { value: 'ap',   label: 'All meals' },
];

const TRANSPORT = [
  { value: 'flight',    label: '✈️ Flight' },
  { value: 'train',     label: '🚆 Train' },
  { value: 'road',      label: '🚗 Road Trip' },
  { value: 'flexible',  label: '🔀 Flexible' },
];

const INTERESTS = [
  { value: 'adventure', label: '🧗 Adventure' },
  { value: 'photography', label: '📸 Photography' },
  { value: 'wildlife',  label: '🦁 Wildlife' },
  { value: 'heritage',  label: '🏛️ Heritage' },
  { value: 'yoga',      label: '🧘 Yoga/Wellness' },
  { value: 'beach',     label: '🏖️ Beach' },
  { value: 'trekking',  label: '⛰️ Trekking' },
  { value: 'food',      label: '🍛 Local Food' },
];

const blank = () => ({
  destination: '', departureDate: '', duration: '',
  adults: 1, children: 0, tripType: '',
  budget: '', accommodation: '', mealPlan: '', transport: '',
  interests: [], specialRequests: '',
  name: '', email: '', phone: '',
});

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                done ? 'bg-teal-600 text-white' :
                active ? 'bg-teal-600 text-white ring-4 ring-teal-200 dark:ring-teal-900' :
                'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <p className={`text-xs mt-1 font-medium hidden sm:block ${active ? 'text-teal-600' : 'text-slate-400'}`}>
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-10 sm:w-16 mb-5 mx-1 transition-colors ${done ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SelectCard({ value, selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
        selected
          ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
          : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 text-slate-700 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
      {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400";

export function CustomizePackage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Require login before submitting a custom request
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-teal-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to continue</h2>
          <p className="text-slate-500 text-sm mb-6">
            You need to be logged in to submit a custom trip request so we can track and update you on your booking.
          </p>
          <button
            onClick={() => navigate('/login', { state: { from: '/customize-package' } })}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors"
          >
            Sign In to Continue
          </button>
          <p className="text-xs text-slate-400 mt-3">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-teal-600 hover:underline font-medium">Register free</button>
          </p>
        </div>
      </div>
    );
  }

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => {
    const f = blank();
    if (user) { f.name = user.name || ''; f.email = user.email || ''; f.phone = user.phone || ''; }
    return f;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function toggleInterest(v) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(v) ? f.interests.filter(i => i !== v) : [...f.interests, v],
    }));
  }

  function validateStep() {
    if (step === 1 && !form.destination.trim()) return 'Please enter a destination.';
    if (step === 2 && form.adults < 1) return 'At least 1 adult required.';
    if (step === 3 && !form.budget) return 'Please select a budget range.';
    if (step === 5) {
      if (!form.name.trim()) return 'Name is required.';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email required.';
    }
    return '';
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  function back() { setError(''); setStep(s => s - 1); }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        duration: form.duration ? Number(form.duration) : undefined,
        adults: Number(form.adults),
        children: Number(form.children),
      };
      const res = await customRequestsAPI.submit(payload);
      setSubmitted(res.data.data.request);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-teal-100 dark:border-slate-700 p-10">
          <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Request Submitted!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Your request <span className="font-mono font-bold text-teal-600">{submitted.requestNumber}</span> has been received.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            Our team will review it and get back to you at <strong>{submitted.email}</strong> within 24 hours.
          </p>
          <div className="flex flex-col gap-3">
            {user && (
              <button
                onClick={() => navigate('/my-account/requests')}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition"
              >
                View My Requests
              </button>
            )}
            <button
              onClick={() => navigate('/packages')}
              className="w-full py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Browse Packages
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700 py-14 px-4 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
            <Wand2 className="w-4 h-4 text-teal-200" />
            <span className="text-sm font-medium text-teal-100">Custom Package</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">Build Your Dream Trip</h1>
          <p className="text-teal-200 text-lg">Tell us what you want — our experts will craft the perfect itinerary.</p>
        </div>
      </section>

      {/* Wizard card */}
      <section className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/60 p-8">
          <StepBar current={step} />

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Destination & Dates */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Where & When?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Tell us your dream destination and when you plan to travel.</p>

              <div>
                <FieldLabel required>Destination</FieldLabel>
                <input
                  type="text"
                  value={form.destination}
                  onChange={e => set('destination', e.target.value)}
                  placeholder="e.g. Kashmir, Goa, Rajasthan..."
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Departure Date</FieldLabel>
                  <input
                    type="date"
                    value={form.departureDate}
                    onChange={e => set('departureDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel>Duration (days)</FieldLabel>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={e => set('duration', e.target.value)}
                    placeholder="e.g. 7"
                    min={1}
                    max={30}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Travelers */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Who's Traveling?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">How many people and what type of trip?</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Adults</FieldLabel>
                  <input type="number" value={form.adults} onChange={e => set('adults', e.target.value)} min={1} max={50} className={inputCls} />
                </div>
                <div>
                  <FieldLabel>Children (under 12)</FieldLabel>
                  <input type="number" value={form.children} onChange={e => set('children', e.target.value)} min={0} max={20} className={inputCls} />
                </div>
              </div>

              <div>
                <FieldLabel>Trip Type</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                  {TRIP_TYPES.map(t => (
                    <SelectCard key={t.value} value={t.value} selected={form.tripType === t.value} onClick={v => set('tripType', v)}>
                      <span className="text-lg mr-2">{t.icon}</span>{t.label}
                    </SelectCard>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget & Stay */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Budget & Stay</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">What's your budget and preferred accommodation?</p>

              <div>
                <FieldLabel required>Budget per person</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {BUDGETS.map(b => (
                    <SelectCard key={b.value} value={b.value} selected={form.budget === b.value} onClick={v => set('budget', v)}>
                      <div className="font-semibold">{b.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{b.sub}</div>
                    </SelectCard>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Accommodation</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {ACCOMMODATION.map(a => (
                    <SelectCard key={a.value} value={a.value} selected={form.accommodation === a.value} onClick={v => set('accommodation', v)}>
                      {a.label}
                    </SelectCard>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Meal Plan</FieldLabel>
                  <select value={form.mealPlan} onChange={e => set('mealPlan', e.target.value)} className={inputCls}>
                    <option value="">Select...</option>
                    {MEAL_PLANS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Transport</FieldLabel>
                  <select value={form.transport} onChange={e => set('transport', e.target.value)} className={inputCls}>
                    <option value="">Select...</option>
                    {TRANSPORT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Interests & Special Requests */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Your Preferences</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Help us personalize the perfect itinerary for you.</p>

              <div>
                <FieldLabel>Interests <span className="text-slate-400 font-normal">(select all that apply)</span></FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {INTERESTS.map(i => (
                    <button
                      key={i.value}
                      type="button"
                      onClick={() => toggleInterest(i.value)}
                      className={`px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                        form.interests.includes(i.value)
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Special Requests or Notes</FieldLabel>
                <textarea
                  value={form.specialRequests}
                  onChange={e => set('specialRequests', e.target.value)}
                  rows={4}
                  placeholder="Any special requirements, dietary needs, accessibility needs, specific sights to visit..."
                  className={inputCls + ' resize-none'}
                />
              </div>
            </div>
          )}

          {/* Step 5: Contact */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Your Contact Details</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">We'll send the custom quote to your email within 24 hours.</p>

              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Harsh Raj" className={inputCls} />
              </div>
              <div>
                <FieldLabel required>Email Address</FieldLabel>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className={inputCls} />
              </div>
              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800">
                <p className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-3">Request Summary</p>
                <dl className="space-y-1.5 text-sm">
                  {[
                    ['Destination', form.destination],
                    ['Travel Date', form.departureDate || 'Flexible'],
                    ['Duration', form.duration ? `${form.duration} days` : 'Flexible'],
                    ['Travelers', `${form.adults} adult${form.adults > 1 ? 's' : ''}${form.children > 0 ? ` · ${form.children} child${form.children > 1 ? 'ren' : ''}` : ''}`],
                    ['Budget', BUDGETS.find(b => b.value === form.budget)?.label || '—'],
                    ['Stay', ACCOMMODATION.find(a => a.value === form.accommodation)?.label || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-slate-500 w-24 flex-shrink-0">{k}</dt>
                      <dd className="text-slate-800 dark:text-slate-200 font-medium">{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/60">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-sm font-semibold transition shadow-lg shadow-teal-200/40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-sm font-semibold disabled:opacity-60 transition shadow-lg shadow-teal-200/40"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

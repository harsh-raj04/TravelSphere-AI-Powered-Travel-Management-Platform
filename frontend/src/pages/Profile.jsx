import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { customerAPI, bookingsAPI } from '../services/api';
import {
  User, Mail, Phone, Calendar, MapPin, Globe, Shield,
  Settings, Plane, Lock, Edit3, Check, X, AlertCircle,
  Star, Mountain, Award, Bell, CreditCard, LogOut,
  Eye, Heart, BarChart2, Gift, Copy, Clock, Camera,
  CheckCircle, ChevronRight, Waves, Landmark, Leaf,
  TrendingUp, Users, FileText, MessageSquare, Key, Zap,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

const AVATAR_GRADIENTS = [
  'from-teal-500 to-emerald-600',
  'from-violet-500 to-purple-600',
  'from-orange-500 to-rose-500',
  'from-blue-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-yellow-500',
];

function avatarGradient(name = '') {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

function getLevel(completedTrips = 0) {
  if (completedTrips >= 6) return { label: 'Globetrotter', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400' };
  if (completedTrips >= 3) return { label: 'Verified Traveler', color: 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-400' };
  if (completedTrips >= 1) return { label: 'Explorer', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400' };
  return { label: 'Wanderer', color: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300' };
}

function calculateCompletion(profile = {}) {
  let score = 20;
  const missing = [];
  if (profile.phone) score += 15; else missing.push({ label: 'Phone number', tab: 'overview', section: 'personal' });
  if (profile.dateOfBirth && profile.gender) score += 10; else missing.push({ label: 'Date of birth & gender', tab: 'overview', section: 'personal' });
  if (profile.city && profile.state) score += 10; else missing.push({ label: 'Location', tab: 'overview', section: 'personal' });
  if ((profile.languages ?? []).length) score += 5; else missing.push({ label: 'Languages', tab: 'overview', section: 'personal' });
  if ((profile.travelPreferences?.travelStyle ?? []).length) score += 15; else missing.push({ label: 'Travel preferences', tab: 'overview', section: 'travelPrefs' });
  const ec = profile.emergencyContact ?? {};
  if (ec.name && ec.phone) score += 20; else missing.push({ label: 'Emergency contact', tab: 'overview', section: 'emergency' });
  if (profile.notificationPrefs) score += 5;
  return { score: Math.min(score, 100), missing };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDOB(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function memberSince(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return 'Just joined';
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const yrs = Math.floor(months / 12);
  return `${yrs} year${yrs !== 1 ? 's' : ''}`;
}

// ─── Toast ─────────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4
      ${type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-500 text-white'}`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {message}
      <button onClick={onDismiss} className="ml-1 opacity-75 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, onEdit, icon: Icon, children, badge }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
              <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h3>
              {badge && <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">{badge}</span>}
            </div>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 dark:text-teal-400 px-3 py-1.5 rounded-lg transition-colors">
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-slate-50 dark:border-slate-700/40 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0 w-36">{label}</span>
      <span className={`text-sm font-medium text-right ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic'}`}>
        {value || 'Not set'}
      </span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1
        ${checked ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function NotifRow({ label, sublabel, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/40 last:border-0">
      <div>
        <p className="text-sm text-slate-700 dark:text-slate-300">{label}</p>
        {sublabel && <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ComingSoon({ label = 'Coming Soon' }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700 rounded-full font-medium">
      <Zap className="w-3 h-3" /> {label}
    </span>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'];
const TRAVEL_STYLES = ['Adventure', 'Leisure', 'Luxury', 'Cultural', 'Family', 'Budget'];
const DEST_TYPES = [
  { value: 'mountains', label: 'Mountains', icon: '🏔️' },
  { value: 'beaches', label: 'Beaches', icon: '🏖️' },
  { value: 'heritage', label: 'Heritage', icon: '🏛️' },
  { value: 'cities', label: 'Cities', icon: '🏙️' },
  { value: 'countryside', label: 'Countryside', icon: '🌿' },
  { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
];

function EditModal({ section, profile, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    if (section === 'personal') {
      return {
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: profile.gender ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        languages: profile.languages ?? [],
      };
    }
    if (section === 'emergency') {
      const ec = profile.emergencyContact ?? {};
      return { name: ec.name ?? '', relation: ec.relation ?? '', phone: ec.phone ?? '' };
    }
    if (section === 'travelPrefs') {
      const tp = profile.travelPreferences ?? {};
      return {
        travelStyle: tp.travelStyle ?? [],
        budgetMin: tp.budgetMin ?? 10000,
        budgetMax: tp.budgetMax ?? 50000,
        destinationTypes: tp.destinationTypes ?? [],
        frequency: tp.frequency ?? '',
        dietary: tp.dietary ?? '',
        specialRequirements: tp.specialRequirements ?? '',
      };
    }
    return {};
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleArr = (key, val) => setForm((f) => ({
    ...f,
    [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
  }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let payload = {};
      if (section === 'personal') {
        payload = { name: form.name, phone: form.phone || null, dateOfBirth: form.dateOfBirth || null, gender: form.gender || null, city: form.city || null, state: form.state || null, languages: form.languages };
      } else if (section === 'emergency') {
        payload = { emergencyContact: form.name ? form : null };
      } else if (section === 'travelPrefs') {
        payload = { travelPreferences: { ...form, budgetMin: Number(form.budgetMin), budgetMax: Number(form.budgetMax) } };
      }
      await onSave(payload);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const titles = { personal: 'Personal Information', emergency: 'Emergency Contact', travelPrefs: 'Travel Preferences' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">{titles[section]}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {section === 'personal' && (
            <>
              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Full Name *</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Phone Number</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Date of Birth</span>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Gender</span>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">City</span>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="New Delhi"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">State</span>
                  <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Delhi"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                </label>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Languages</span>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button key={lang} type="button" onClick={() => toggleArr('languages', lang)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                        ${form.languages.includes(lang) ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-teal-400'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {section === 'emergency' && (
            <>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                Emergency contacts help us reach your family in case of travel emergencies.
              </div>
              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Contact Name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Relationship</span>
                <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">Select relationship</option>
                  {['Father', 'Mother', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Phone Number</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
              </label>
            </>
          )}

          {section === 'travelPrefs' && (
            <>
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Travel Style (select all that apply)</span>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_STYLES.map((s) => (
                    <button key={s} type="button" onClick={() => toggleArr('travelStyle', s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                        ${form.travelStyle.includes(s) ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-teal-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                  Budget Range: ₹{Number(form.budgetMin).toLocaleString()} – ₹{Number(form.budgetMax).toLocaleString()}
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-6">Min</span>
                    <input type="range" min={1000} max={100000} step={1000} value={form.budgetMin}
                      onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                      className="flex-1 accent-teal-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-6">Max</span>
                    <input type="range" min={5000} max={500000} step={5000} value={form.budgetMax}
                      onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                      className="flex-1 accent-teal-600" />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Preferred Destinations</span>
                <div className="flex flex-wrap gap-2">
                  {DEST_TYPES.map(({ value, label, icon }) => (
                    <button key={value} type="button" onClick={() => toggleArr('destinationTypes', value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                        ${form.destinationTypes.includes(value) ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-teal-400'}`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Travel Frequency</span>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">Select</option>
                    {['Monthly', 'Quarterly', 'Biannually', 'Yearly'].map((f) => <option key={f} value={f.toLowerCase()}>{f}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Dietary Preference</span>
                  <select value={form.dietary} onChange={(e) => setForm({ ...form, dietary: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">Select</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non_vegetarian">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="jain">Jain</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Special Requirements</span>
                <textarea value={form.specialRequirements} onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
                  rows={2} placeholder="Wheelchair access, allergies, etc."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none" />
              </label>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</> : <><Check className="w-4 h-4" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────

function OverviewTab({ profile, bookings, onEdit }) {
  const completedTrips = bookings.filter((b) => b.status === 'completed' || b.status === 'closed');
  const upcomingTrips = bookings.filter((b) => new Date(b.travelDate) > new Date() && b.status !== 'cancelled');
  const destinations = [...new Set(completedTrips.map((b) => b.package?.destination).filter(Boolean))];
  const reviews = bookings.filter((b) => b.feedbackRating != null);

  const prefs = profile.travelPreferences ?? {};
  const ec = profile.emergencyContact ?? {};

  const achievements = [
    { emoji: '🎒', title: 'First Journey', desc: 'Completed your first trip', unlocked: bookings.length > 0 },
    { emoji: '⭐', title: '5-Star Traveler', desc: 'Left a 5-star review', unlocked: bookings.some((b) => b.feedbackRating === 5) },
    { emoji: '🏔️', title: 'Mountain Explorer', desc: 'Visited 1+ hill stations', unlocked: completedTrips.some((b) => /shimla|manali|ladakh|leh|kashmir|himachal|uttarakhand/i.test(b.package?.destination ?? '')) },
    { emoji: '🙏', title: "Pilgrim's Path", desc: 'Completed a pilgrimage trip', unlocked: completedTrips.some((b) => b.package?.category === 'pilgrimage') },
    { emoji: '👨‍👩‍👧', title: 'Family Bonding', desc: 'Booked a family tour', unlocked: completedTrips.some((b) => b.package?.category === 'family_tours') },
    { emoji: '🌍', title: 'Frequent Flyer', desc: 'Completed 5+ trips', unlocked: completedTrips.length >= 5 },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: 'Member Since', value: memberSince(profile.createdAt), gradient: 'from-teal-500 to-emerald-600' },
          { icon: Plane, label: 'Trips Completed', value: completedTrips.length, gradient: 'from-blue-500 to-indigo-600' },
          { icon: MapPin, label: 'Destinations', value: destinations.length, gradient: 'from-violet-500 to-purple-600' },
          { icon: Star, label: 'Reviews Written', value: reviews.length, gradient: 'from-amber-500 to-orange-600' },
        ].map(({ icon: Icon, label, value, gradient }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Personal Info */}
      <SectionCard title="Personal Information" icon={User} onEdit={() => onEdit('personal')}>
        <InfoRow label="Full Name" value={profile.name} />
        <InfoRow label="Email" value={profile.email} />
        <InfoRow label="Phone" value={profile.phone} />
        <InfoRow label="Date of Birth" value={formatDOB(profile.dateOfBirth)} />
        <InfoRow label="Gender" value={profile.gender?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
        <InfoRow label="Location" value={profile.city && profile.state ? `${profile.city}, ${profile.state}` : profile.city || profile.state} />
        <InfoRow label="Languages" value={(profile.languages ?? []).join(', ') || null} />
      </SectionCard>

      {/* Travel Preferences */}
      <SectionCard title="Travel Preferences" icon={Globe} onEdit={() => onEdit('travelPrefs')}>
        {prefs.travelStyle?.length ? (
          <div className="mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Travel Style</p>
            <div className="flex flex-wrap gap-1.5">
              {prefs.travelStyle.map((s) => (
                <span key={s} className="px-2.5 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-medium rounded-full border border-teal-200 dark:border-teal-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {(prefs.budgetMin || prefs.budgetMax) && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Budget Preference</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">₹{Number(prefs.budgetMin).toLocaleString()} – ₹{Number(prefs.budgetMax).toLocaleString()} per trip</p>
          </div>
        )}
        {prefs.destinationTypes?.length ? (
          <div className="mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Preferred Destinations</p>
            <div className="flex flex-wrap gap-1.5">
              {prefs.destinationTypes.map((d) => {
                const dt = DEST_TYPES.find((x) => x.value === d);
                return (
                  <span key={d} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                    {dt?.icon} {dt?.label ?? d}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}
        <InfoRow label="Frequency" value={prefs.frequency ? prefs.frequency.charAt(0).toUpperCase() + prefs.frequency.slice(1) : null} />
        <InfoRow label="Dietary" value={prefs.dietary?.replace('_', '-').replace(/\b\w/g, (c) => c.toUpperCase())} />
        {!prefs.travelStyle?.length && !prefs.budgetMin && !prefs.destinationTypes?.length && (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">No preferences set — click Edit to personalize your recommendations.</p>
        )}
      </SectionCard>

      {/* Achievements */}
      <SectionCard title="Achievements" icon={Award} subtitle="Travel milestones you've earned">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <div key={ach.title} className={`relative p-3 rounded-xl border transition-all ${ach.unlocked ? 'border-teal-200 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/20' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60'}`}>
              <div className="text-2xl mb-1.5">{ach.emoji}</div>
              <p className={`text-xs font-semibold ${ach.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{ach.title}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{ach.desc}</p>
              {ach.unlocked && <Check className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-teal-500" />}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard title="Emergency Contact" icon={Shield} onEdit={() => onEdit('emergency')} subtitle="For safety during your travels">
        {ec.name ? (
          <>
            <InfoRow label="Name" value={ec.name} />
            <InfoRow label="Relationship" value={ec.relation} />
            <InfoRow label="Phone" value={ec.phone} />
          </>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">No emergency contact set</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Add a contact so we can reach your family in emergencies.</p>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Tab: Settings ─────────────────────────────────────────────────────────

function SettingsTab({ profile, onSave, user }) {
  const defaultNotif = {
    email: { bookingConfirmations: true, tripReminders: true, paymentReceipts: true, specialOffers: true, newsletter: false, customRequestUpdates: true },
    push: { bookingUpdates: true, communityMessages: true, marketing: false },
    sms: { bookingConfirmationsOnly: true },
  };

  const [notif, setNotif] = useState(() => profile.notificationPrefs ?? defaultNotif);
  const [saving, setSaving] = useState(false);

  const toggleNotif = useCallback(async (section, key) => {
    const updated = { ...notif, [section]: { ...notif[section], [key]: !notif[section][key] } };
    setNotif(updated);
    setSaving(true);
    try { await onSave({ notificationPrefs: updated }); } finally { setSaving(false); }
  }, [notif, onSave]);

  const referralCode = profile.referralCode ?? '—';

  const copyCode = () => { navigator.clipboard.writeText(referralCode); };

  return (
    <div className="space-y-5">
      {/* Email */}
      <SectionCard title="Email Address" icon={Mail}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-900 dark:text-white">{user?.email}</span>
            <span className="flex items-center gap-1 text-xs text-teal-600 font-medium"><Check className="w-3.5 h-3.5" />Verified</span>
          </div>
          <ComingSoon label="Change Email" />
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notification Preferences" icon={Bell} subtitle={saving ? 'Saving…' : 'Saved automatically'}>
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Email</p>
          <NotifRow label="Booking confirmations" checked={notif.email.bookingConfirmations} onChange={() => toggleNotif('email', 'bookingConfirmations')} />
          <NotifRow label="Trip reminders" sublabel="3 days before travel" checked={notif.email.tripReminders} onChange={() => toggleNotif('email', 'tripReminders')} />
          <NotifRow label="Payment receipts" checked={notif.email.paymentReceipts} onChange={() => toggleNotif('email', 'paymentReceipts')} />
          <NotifRow label="Special offers & deals" checked={notif.email.specialOffers} onChange={() => toggleNotif('email', 'specialOffers')} />
          <NotifRow label="Weekly newsletter" checked={notif.email.newsletter} onChange={() => toggleNotif('email', 'newsletter')} />
        </div>
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Push Notifications</p>
          <NotifRow label="Booking updates" checked={notif.push.bookingUpdates} onChange={() => toggleNotif('push', 'bookingUpdates')} />
          <NotifRow label="Community messages" checked={notif.push.communityMessages} onChange={() => toggleNotif('push', 'communityMessages')} />
          <NotifRow label="Marketing" checked={notif.push.marketing} onChange={() => toggleNotif('push', 'marketing')} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">SMS</p>
          <NotifRow label="Booking confirmations only" sublabel={profile.phone ?? 'Add phone number first'} checked={notif.sms.bookingConfirmationsOnly} onChange={() => toggleNotif('sms', 'bookingConfirmationsOnly')} />
        </div>
      </SectionCard>

      {/* Payment Methods */}
      <SectionCard title="Payment Methods" icon={CreditCard} subtitle="Manage your saved payment methods">
        <div className="flex flex-col items-center py-6 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No saved payment methods</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Save cards, UPI, and bank accounts for faster checkout</p>
          </div>
          <ComingSoon />
        </div>
      </SectionCard>

      {/* Membership */}
      <SectionCard title="Membership & Loyalty" icon={Award}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current Plan</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Free Explorer</p>
          </div>
          <ComingSoon label="Upgrade to Premium" />
        </div>
        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          {['Priority customer support', 'Exclusive deals & discounts', 'Free cancellations', 'Dedicated travel advisor'].map((b) => (
            <div key={b} className="flex items-center gap-2 opacity-50">
              <Check className="w-3.5 h-3.5 text-teal-500" />{b}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Referral */}
      <SectionCard title="Refer & Earn" icon={Gift}>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Share your code with friends. They get ₹500 off their first booking, you earn ₹500 credit!</p>
        <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl">
          <span className="flex-1 font-mono font-bold text-teal-700 dark:text-teal-400 tracking-widest text-base">{referralCode}</span>
          <button onClick={copyCode} className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800 bg-white dark:bg-teal-900/50 border border-teal-200 dark:border-teal-700 px-3 py-1.5 rounded-lg transition-colors">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Friends Referred: <strong className="text-slate-700 dark:text-slate-300">0</strong> · Earnings: <strong className="text-slate-700 dark:text-slate-300">₹0</strong></p>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Travel ────────────────────────────────────────────────────────────

function TravelTab({ bookings }) {
  const [filter, setFilter] = useState('all');
  const now = new Date();

  const filtered = bookings.filter((b) => {
    if (filter === 'upcoming') return new Date(b.travelDate) > now && b.status !== 'cancelled';
    if (filter === 'completed') return b.status === 'completed' || b.status === 'closed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const completedBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'closed');
  const totalDays = completedBookings.reduce((sum, b) => sum + (b.package?.durationDays ?? 0), 0);
  const uniqueDests = [...new Set(completedBookings.map((b) => b.package?.destination).filter(Boolean))];

  const statusColor = {
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    closed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    in_progress: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    assigned: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    accepted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Days Traveled', value: totalDays, icon: '🗓️' },
          { label: 'Destinations Visited', value: uniqueDests.length, icon: '📍' },
          { label: 'Trips Completed', value: completedBookings.length, icon: '✈️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <SectionCard title="Trip Timeline" icon={Clock} badge={`${bookings.length} trips`}>
        <div className="flex gap-2 mb-5">
          {['all', 'upcoming', 'completed', 'cancelled'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors
                ${filter === f ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-teal-100 dark:hover:bg-slate-600'}`}>
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Plane className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No {filter === 'all' ? '' : filter} trips</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {filter === 'all' ? <><Link to="/packages" className="text-teal-600 hover:underline">Browse packages</Link> to plan your first adventure!</> : 'Nothing to show here.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-700" />
            <div className="space-y-4">
              {filtered.map((booking) => {
                const isUpcoming = new Date(booking.travelDate) > now;
                return (
                  <div key={booking.id} className="relative flex gap-4 pl-12">
                    <div className={`absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isUpcoming ? 'bg-teal-500' : 'bg-slate-400'}`} />
                    <div className="flex-1 bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{booking.package?.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3" />{booking.package?.destination ?? '—'}
                            <span>·</span>
                            <Clock className="w-3 h-3" />{booking.package?.durationDays ?? '?'} days
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${statusColor[booking.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {isUpcoming ? '🗓️ Departing' : '✈️ Traveled'} {formatDate(booking.travelDate)}
                        </p>
                        <div className="flex items-center gap-2">
                          {booking.feedbackRating && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{booking.feedbackRating}
                            </span>
                          )}
                          <Link to={`/bookings/${booking.id}`} className="text-xs text-teal-600 hover:underline font-medium">View</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Wishlist */}
      <SectionCard title="Saved Packages (Wishlist)" icon={Heart} subtitle="Packages you've saved for later">
        <div className="flex flex-col items-center py-6 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Wishlist coming soon</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Save packages you love to book them later</p>
          <ComingSoon />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Security ──────────────────────────────────────────────────────────

function SecurityTab({ onPasswordChange }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [show, setShow] = useState({ curr: false, new: false, conf: false });

  const handleChange = async () => {
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match'); return; }
    if (form.newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setSaving(true);
    try {
      await onPasswordChange({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const pwInput = (key, showKey, label, placeholder) => (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">{label}</span>
      <div className="relative">
        <input
          type={show[showKey] ? 'text' : 'password'}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
        />
        <button type="button" onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );

  return (
    <div className="space-y-5">
      {/* Change Password */}
      <SectionCard title="Change Password" icon={Key}>
        <div className="space-y-4 max-w-sm">
          {pwInput('currentPassword', 'curr', 'Current Password', 'Enter current password')}
          {pwInput('newPassword', 'new', 'New Password', 'Min 8 characters')}
          {pwInput('confirmPassword', 'conf', 'Confirm New Password', 'Repeat new password')}
          <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
            {['At least 8 characters', 'Mix of uppercase & lowercase', 'Include numbers & symbols'].map((r) => (
              <div key={r} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal-400" />{r}</div>
            ))}
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
          {success && <p className="text-xs text-teal-600 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />Password changed successfully!</p>}
          <button onClick={handleChange} disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
            {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      </SectionCard>

      {/* 2FA */}
      <SectionCard title="Two-Factor Authentication" icon={Shield}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Status: <span className="text-slate-500 dark:text-slate-400">Not Enabled</span></p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Add an extra layer of security to your account</p>
          </div>
          <ComingSoon label="Enable 2FA" />
        </div>
      </SectionCard>

      {/* Sessions */}
      <SectionCard title="Active Sessions" icon={Globe}>
        <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-xl mb-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
            <Globe className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Current session</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Browser · Active now</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Full session management — <ComingSoon /></p>
      </SectionCard>

      {/* Login Activity */}
      <SectionCard title="Login Activity" icon={TrendingUp}>
        <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Today</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Browser session started</p>
          </div>
          <span className="text-xs text-slate-400">Just now</span>
        </div>
        <div className="mt-3"><ComingSoon label="Full activity log coming soon" /></div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Privacy ───────────────────────────────────────────────────────────

function PrivacyTab({ profile, onSave }) {
  const defaultSettings = {
    profileVisibility: 'public',
    showInCommunity: { displayName: true, avatar: true, email: false, tripsCompleted: true, currentLocation: false },
    marketingPrefs: { personalizedRecommendations: true, locationBasedOffers: true, thirdPartyOffers: false, surveyInvitations: true },
  };

  const [settings, setSettings] = useState(() => profile.privacySettings ?? defaultSettings);
  const [saving, setSaving] = useState(false);

  const saveSettings = async (updated) => {
    setSettings(updated);
    setSaving(true);
    try { await onSave({ privacySettings: updated }); } finally { setSaving(false); }
  };

  const toggleCommunity = (key) => {
    const updated = { ...settings, showInCommunity: { ...settings.showInCommunity, [key]: !settings.showInCommunity[key] } };
    saveSettings(updated);
  };

  const toggleMarketing = (key) => {
    const updated = { ...settings, marketingPrefs: { ...settings.marketingPrefs, [key]: !settings.marketingPrefs[key] } };
    saveSettings(updated);
  };

  const setVisibility = (v) => saveSettings({ ...settings, profileVisibility: v });

  return (
    <div className="space-y-5">
      {/* Visibility */}
      <SectionCard title="Profile Visibility" icon={Eye} subtitle={saving ? 'Saving…' : 'Controls who can see your profile'}>
        <div className="space-y-2">
          {[
            { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
            { value: 'friends', label: 'Friends Only', desc: 'Only community connections can see' },
            { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
          ].map(({ value, label, desc }) => (
            <label key={value} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors
              ${settings.profileVisibility === value ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-600' : 'border-slate-100 dark:border-slate-700 hover:border-teal-300'}`}>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
              <input type="radio" name="visibility" value={value} checked={settings.profileVisibility === value} onChange={() => setVisibility(value)} className="accent-teal-600" />
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Show in Community */}
      <SectionCard title="Show in Community" icon={Users}>
        <NotifRow label="Display name" checked={settings.showInCommunity?.displayName ?? true} onChange={() => toggleCommunity('displayName')} />
        <NotifRow label="Profile avatar" checked={settings.showInCommunity?.avatar ?? true} onChange={() => toggleCommunity('avatar')} />
        <NotifRow label="Email address" checked={settings.showInCommunity?.email ?? false} onChange={() => toggleCommunity('email')} />
        <NotifRow label="Trips completed" checked={settings.showInCommunity?.tripsCompleted ?? true} onChange={() => toggleCommunity('tripsCompleted')} />
        <NotifRow label="Current location" checked={settings.showInCommunity?.currentLocation ?? false} onChange={() => toggleCommunity('currentLocation')} />
      </SectionCard>

      {/* Marketing */}
      <SectionCard title="Marketing Preferences" icon={Bell}>
        <NotifRow label="Personalized recommendations" sublabel="AI-based travel suggestions" checked={settings.marketingPrefs?.personalizedRecommendations ?? true} onChange={() => toggleMarketing('personalizedRecommendations')} />
        <NotifRow label="Location-based offers" sublabel="Deals near your location" checked={settings.marketingPrefs?.locationBasedOffers ?? true} onChange={() => toggleMarketing('locationBasedOffers')} />
        <NotifRow label="Third-party offers" checked={settings.marketingPrefs?.thirdPartyOffers ?? false} onChange={() => toggleMarketing('thirdPartyOffers')} />
        <NotifRow label="Survey invitations" checked={settings.marketingPrefs?.surveyInvitations ?? true} onChange={() => toggleMarketing('surveyInvitations')} />
      </SectionCard>

      {/* Data management */}
      <SectionCard title="Data & Account" icon={FileText}>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Download My Data</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Get a copy of all your data (GDPR)</p>
            </div>
            <ComingSoon />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete My Account</p>
              <p className="text-xs text-red-400 dark:text-red-500">Permanently deletes all your data. Cannot be undone.</p>
            </div>
            <ComingSoon label="Delete Account" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'privacy', label: 'Privacy', icon: Shield },
];

function Sidebar({ tab, setTab, onLogout }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1 pr-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full
              ${tab === id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
            <Icon className="w-4 h-4 shrink-0" />{label}
          </button>
        ))}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-1">
          <Link to="/bookings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <FileText className="w-4 h-4" />My Bookings
          </Link>
          <Link to="/support" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <MessageSquare className="w-4 h-4" />Support
          </Link>
          <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top tabs */}
      <div className="lg:hidden flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0
              ${tab === id ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Main Profile Component ─────────────────────────────────────────────────

export function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [editModal, setEditModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, bookingsRes] = await Promise.all([customerAPI.getProfile(), bookingsAPI.myBookings()]);
        setProfile(profileRes.data.data.profile);
        setBookings(bookingsRes.data.data.bookings ?? []);
      } catch {
        setToast({ message: 'Failed to load profile', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveProfile = useCallback(async (data) => {
    const res = await customerAPI.updateProfile(data);
    setProfile(res.data.data.profile);
    setToast({ message: 'Profile updated successfully!', type: 'success' });
  }, []);

  const changePassword = useCallback(async (data) => {
    await customerAPI.changePassword(data);
    setToast({ message: 'Password changed successfully!', type: 'success' });
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  const completedTrips = bookings.filter((b) => b.status === 'completed' || b.status === 'closed');
  const level = getLevel(completedTrips.length);
  const { score: completion, missing } = calculateCompletion(profile);
  const initials = getInitials(profile.name ?? user?.name ?? 'U');
  const gradient = avatarGradient(profile.name ?? '');

  return (
    <div className="travel-ui min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                <span className="text-3xl font-bold text-white tracking-tight">{initials}</span>
              </div>
              <button className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </button>
              <div className="absolute -bottom-1.5 -right-1.5">
                <ComingSoon label="" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h1>
                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${level.color}`}>
                  {level.label}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{profile.email}</p>

              {/* Completion bar */}
              <div className="max-w-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Profile {completion}% complete</span>
                  {completion === 100 && <span className="text-xs text-teal-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />All done!</span>}
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${completion}%` }} />
                </div>
                {missing.length > 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    Add: {missing.slice(0, 2).map((m, i) => (
                      <button key={m.label} onClick={() => { setTab(m.tab); setEditModal(m.section); }}
                        className="text-teal-600 hover:underline">{m.label}{i < Math.min(missing.length, 2) - 1 ? ', ' : ''}</button>
                    ))}
                    {missing.length > 2 && ` +${missing.length - 2} more`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <Sidebar tab={tab} setTab={setTab} onLogout={logout} />

          <main className="flex-1 min-w-0">
            {tab === 'overview' && <OverviewTab profile={profile} bookings={bookings} onEdit={(section) => setEditModal(section)} />}
            {tab === 'settings' && <SettingsTab profile={profile} onSave={saveProfile} user={user} />}
            {tab === 'travel' && <TravelTab bookings={bookings} />}
            {tab === 'security' && <SecurityTab onPasswordChange={changePassword} />}
            {tab === 'privacy' && <PrivacyTab profile={profile} onSave={saveProfile} />}
          </main>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <EditModal
          section={editModal}
          profile={profile}
          onSave={saveProfile}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}

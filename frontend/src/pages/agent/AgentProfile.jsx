import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Building2, BadgeCheck,
  Pencil, Check, X, Loader2, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { agentAPI } from '../../services/api';

// ─── cls helper ───────────────────────────────────────────────────────────────

function cls(...args) {
  return args.filter(Boolean).join(' ');
}

// ─── OtpBoxes ─────────────────────────────────────────────────────────────────

/**
 * 6 individual character boxes that together represent a 6-digit OTP.
 * Supports paste, backspace navigation, and disabled state.
 */
function OtpBoxes({ value = '', onChange, disabled }) {
  const inputs = useRef([]);

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace' && !e.target.value && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleChange = (e, idx) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = Array.from({ length: 6 }, (_, i) => value[i] || '');
    arr[idx] = ch;
    onChange(arr.join(''));
    if (ch && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted);
      inputs.current[5]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKey(e, idx)}
          className={cls(
            'w-10 h-12 text-center text-lg font-bold rounded-lg border-2 outline-none transition-colors',
            'focus:border-teal-500 focus:ring-2 focus:ring-teal-100',
            disabled
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-900',
          )}
        />
      ))}
    </div>
  );
}

// ─── CountdownTimer ───────────────────────────────────────────────────────────

function CountdownTimer({ expiresAt, onExpire }) {
  const remaining = () => Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const [secs, setSecs] = useState(remaining);

  useEffect(() => {
    if (secs <= 0) { onExpire?.(); return; }
    const t = setInterval(() => {
      const s = remaining();
      setSecs(s);
      if (s <= 0) { clearInterval(t); onExpire?.(); }
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');

  return (
    <span className={cls('text-xs font-medium tabular-nums', secs < 60 ? 'text-red-500' : 'text-gray-500')}>
      {m}:{s} remaining
    </span>
  );
}

// ─── ChangeFlow ───────────────────────────────────────────────────────────────

/**
 * Two-step inline flow: enter new value -> enter OTP -> done.
 *
 * Props:
 *   type: 'email' | 'phone'
 *   onSuccess(newValue: string)
 *   onCancel()
 */
function ChangeFlow({ type, onSuccess, onCancel }) {
  const isEmail = type === 'email';
  const label = isEmail ? 'email address' : 'phone number';
  const placeholder = isEmail ? 'new@example.com' : '9XXXXXXXXX (10 digits)';

  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [newValue, setNewValue] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [expired, setExpired] = useState(false);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      if (isEmail) {
        await agentAPI.requestEmailChange(newValue.trim());
      } else {
        await agentAPI.requestPhoneChange(newValue.trim());
      }
      setExpiresAt(Date.now() + 10 * 60 * 1000);
      setExpired(false);
      setOtp('');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to send OTP to new ${label}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isEmail) {
        await agentAPI.verifyEmailChange(newValue.trim(), otp);
      } else {
        await agentAPI.verifyPhoneChange(newValue.trim(), otp);
      }
      setSuccess(`${isEmail ? 'Email' : 'Phone number'} updated successfully!`);
      setTimeout(() => onSuccess(newValue.trim()), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp('');
    setExpired(false);
    setError('');
    setLoading(true);
    try {
      if (isEmail) {
        await agentAPI.requestEmailChange(newValue.trim());
      } else {
        await agentAPI.requestPhoneChange(newValue.trim());
      }
      setExpiresAt(Date.now() + 10 * 60 * 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
      {step === 'input' ? (
        <>
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            Enter new {label}
          </p>
          <input
            type={isEmail ? 'email' : 'tel'}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400
                       disabled:bg-gray-100 bg-white"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSendOtp}
              disabled={loading || !newValue.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700
                         text-white text-sm font-medium rounded-lg transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send OTP
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900
                         hover:bg-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {/* OTP step header */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
              OTP sent to {isEmail ? newValue : `+91 ${newValue}`}
            </p>
            {expiresAt && !expired && (
              <CountdownTimer expiresAt={expiresAt} onExpire={() => setExpired(true)} />
            )}
            {expired && (
              <span className="text-xs text-red-500 font-medium">OTP expired</span>
            )}
          </div>

          <OtpBoxes value={otp} onChange={setOtp} disabled={loading || expired} />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {!expired ? (
              <button
                onClick={handleVerify}
                disabled={loading || otp.length < 6}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700
                           text-white text-sm font-medium rounded-lg transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Check className="w-3.5 h-3.5" />}
                Verify &amp; Update
              </button>
            ) : (
              <button
                onClick={handleResend}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700
                           text-white text-sm font-medium rounded-lg transition-colors
                           disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Resend OTP
              </button>
            )}
            <button
              onClick={() => { setStep('input'); setOtp(''); setError(''); }}
              disabled={loading}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800
                         hover:bg-white rounded-lg transition-colors"
            >
              Change {label}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800
                         hover:bg-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

/**
 * A profile information row. Accepts:
 *   - value: the string to display
 *   - editMode + editContent: show an input instead of the value
 *   - changeButton: show a "Change" link next to the value
 *   - expandedContent: arbitrary JSX rendered below the value row (for ChangeFlow)
 */
function InfoRow({
  icon: Icon,
  label,
  value,
  editMode = false,
  editContent = null,
  changeButton = false,
  onChangeClick,
  changeActive = false,
  expandedContent = null,
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">
            {label}
          </p>

          {editMode && editContent ? (
            editContent
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900 break-all">
                {value || '—'}
              </p>
              {changeButton && (
                <button
                  onClick={onChangeClick}
                  className={cls(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md transition-colors',
                    changeActive
                      ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                      : 'text-teal-600 hover:bg-teal-100',
                  )}
                >
                  {changeActive
                    ? <><X className="w-3 h-3" /> Close</>
                    : <><ChevronRight className="w-3 h-3" /> Change</>}
                </button>
              )}
            </div>
          )}

          {/* Inline ChangeFlow or any other expanded content */}
          {!editMode && expandedContent}
        </div>
      </div>
    </div>
  );
}

// ─── AgentProfile (main page) ─────────────────────────────────────────────────

export function AgentProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Server-side profile state (richer than the JWT-stored user object)
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Non-sensitive field edit mode
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAgency, setEditAgency] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Which sensitive change flow is currently open: null | 'email' | 'phone'
  const [changeFlow, setChangeFlow] = useState(null);

  // ─── Fetch profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    agentAPI.getProfile()
      .then((res) => {
        const p = res.data.data.profile;
        setProfile(p);
        setEditName(p.name || '');
        setEditAgency(p.agentProfile?.agencyName || '');
      })
      .catch(() => {
        // Fall back to data already in auth context
        if (user) {
          setProfile({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            agentProfile: user.agentProfile || null,
          });
          setEditName(user.name || '');
          setEditAgency(user.agentProfile?.agencyName || '');
        }
      })
      .finally(() => setLoadingProfile(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convenience alias: display whatever we have (server or context fallback)
  const dp = profile || {
    name: user?.name,
    email: user?.email,
    createdAt: user?.createdAt,
    agentProfile: user?.agentProfile,
  };

  const joinedDate = dp.createdAt
    ? new Date(dp.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : 'N/A';

  // ─── Save non-sensitive edits (name + agencyName) ────────────────────────────
  const handleSaveEdits = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    const payload = {};
    if (editName.trim() && editName.trim() !== dp.name)
      payload.name = editName.trim();
    if (editAgency.trim() && editAgency.trim() !== dp.agentProfile?.agencyName)
      payload.agencyName = editAgency.trim();

    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      setSaving(false);
      return;
    }

    try {
      const res = await agentAPI.updateProfile(payload);
      const updated = res.data.data.profile;
      setProfile(updated);
      updateUser({ name: updated.name });
      setSaveSuccess('Profile saved successfully.');
      setEditMode(false);
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(dp.name || '');
    setEditAgency(dp.agentProfile?.agencyName || '');
    setSaveError('');
    setEditMode(false);
  };

  // ─── OTP success callbacks ────────────────────────────────────────────────────
  const handleEmailSuccess = (newEmail) => {
    setProfile((prev) => prev ? { ...prev, email: newEmail } : prev);
    updateUser({ email: newEmail });
    setChangeFlow(null);
  };

  const handlePhoneSuccess = (newPhone) => {
    setProfile((prev) =>
      prev ? {
        ...prev,
        agentProfile: prev.agentProfile
          ? { ...prev.agentProfile, contactNumber: newPhone }
          : { contactNumber: newPhone },
      } : prev
    );
    setChangeFlow(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">View and manage your account details</p>
        </div>
        {!editMode && !loadingProfile && (
          <button
            onClick={() => {
              setEditMode(true);
              setSaveError('');
              setSaveSuccess('');
              setChangeFlow(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700
                       text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Global success banner */}
      {saveSuccess && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl
                        text-sm text-green-700 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          {saveSuccess}
        </div>
      )}

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
        <div className="h-24 bg-gradient-to-r from-teal-500 to-teal-700" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500
                            rounded-full flex items-center justify-center border-4 border-white shadow-md">
              <User className="w-9 h-9 text-white" />
            </div>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              {editMode ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                  className="text-xl font-bold text-gray-900 border-b-2 border-teal-400
                             bg-transparent outline-none pb-0.5 w-full max-w-xs"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{dp.name || 'Agent'}</h2>
              )}
              <p className="text-sm text-gray-500 mt-0.5">{dp.email || ''}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50
                             text-teal-700 border border-teal-200 rounded-full text-xs font-semibold">
              <BadgeCheck className="w-3.5 h-3.5" />
              Travel Agent
            </span>
          </div>

          {/* Edit mode controls */}
          {editMode && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSaveEdits}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700
                           text-white text-sm font-medium rounded-lg transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Check className="w-3.5 h-3.5" />}
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300
                           text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg
                           transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              {saveError && (
                <p className="text-xs text-red-600 w-full mt-1">{saveError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account information card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">Account Information</h3>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">

            {/* Full Name */}
            <InfoRow
              icon={User}
              label="Full Name"
              value={dp.name}
              editMode={editMode}
              editContent={
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
              }
            />

            {/* Email Address — sensitive, uses OTP flow */}
            <InfoRow
              icon={Mail}
              label="Email Address"
              value={dp.email}
              changeButton={!editMode}
              onChangeClick={() => setChangeFlow(changeFlow === 'email' ? null : 'email')}
              changeActive={changeFlow === 'email'}
              expandedContent={
                changeFlow === 'email' ? (
                  <ChangeFlow
                    type="email"
                    onSuccess={handleEmailSuccess}
                    onCancel={() => setChangeFlow(null)}
                  />
                ) : null
              }
            />

            {/* Contact Number — sensitive, uses OTP flow */}
            <InfoRow
              icon={Phone}
              label="Contact Number"
              value={dp.agentProfile?.contactNumber || null}
              changeButton={!editMode}
              onChangeClick={() => setChangeFlow(changeFlow === 'phone' ? null : 'phone')}
              changeActive={changeFlow === 'phone'}
              expandedContent={
                changeFlow === 'phone' ? (
                  <ChangeFlow
                    type="phone"
                    onSuccess={handlePhoneSuccess}
                    onCancel={() => setChangeFlow(null)}
                  />
                ) : null
              }
            />

            {/* Agency Name */}
            <InfoRow
              icon={Building2}
              label="Agency"
              value={dp.agentProfile?.agencyName || null}
              editMode={editMode}
              editContent={
                <input
                  value={editAgency}
                  onChange={(e) => setEditAgency(e.target.value)}
                  placeholder="Agency name"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
              }
            />

            {/* Member Since — read-only always */}
            <InfoRow
              icon={Calendar}
              label="Member Since"
              value={joinedDate}
            />

          </div>
        )}
      </div>
    </div>
  );
}

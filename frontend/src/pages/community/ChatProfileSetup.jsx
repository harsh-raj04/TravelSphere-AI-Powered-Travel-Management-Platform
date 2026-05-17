import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, User } from 'lucide-react';
import { chatAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';

export function ChatProfileSetup() {
  const navigate = useNavigate();
  const { setChatProfile } = useChat();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!displayName.trim()) { setError('Display name is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await chatAPI.createProfile({ displayName: displayName.trim(), bio: bio.trim() || undefined });
      setChatProfile(res.data?.data);
      navigate('/community', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create profile');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join the Community</h1>
          <p className="text-gray-500 text-sm mt-2">Choose a display name to start chatting with fellow travelers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Display Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. TravellerHarsh" maxLength={20}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
            </div>
            <p className="text-xs text-gray-400 mt-1">3–20 characters, letters/numbers/spaces/underscores only</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={200}
              placeholder="Tell other travelers a bit about yourself…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-300" />
          </div>

          {error && <p className="text-sm text-red-500">⚠ {error}</p>}

          <button type="submit" disabled={loading || !displayName.trim()}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition">
            {loading ? 'Creating profile…' : 'Join Community →'}
          </button>
        </form>
      </div>
    </div>
  );
}

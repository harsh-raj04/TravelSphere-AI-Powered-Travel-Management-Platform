import { useState, useEffect } from 'react';
import { Users, MessageSquare, Flag, Shield, BarChart2, Trash2, CheckCircle, AlertTriangle, Ban } from 'lucide-react';
import { chatAPI } from '../../services/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

const TABS = ['overview', 'flagged', 'users', 'groups'];

function StatCard({ icon: Icon, label, value, color = 'teal' }) {
  const colors = { teal: 'bg-teal-50 text-teal-700', red: 'bg-red-50 text-red-700', orange: 'bg-orange-50 text-orange-700', blue: 'bg-blue-50 text-blue-700' };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export function AdminChatModeration() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [bannedFilter, setBannedFilter] = useState('');
  const [banModal, setBanModal] = useState(null); // { profileId, displayName }
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, flaggedRes, usersRes, groupsRes] = await Promise.all([
        chatAPI.adminStats(),
        chatAPI.adminFlagged(),
        chatAPI.adminUsers({}),
        chatAPI.adminGroups(),
      ]);
      setStats(statsRes.data?.data);
      setFlagged(flaggedRes.data?.data?.messages || []);
      setUsers(usersRes.data?.data?.profiles || []);
      setGroups(groupsRes.data?.data || []);
    } catch {}
    setLoading(false);
  }

  async function handleDeleteMessage(messageId) {
    setActionLoading(messageId);
    try {
      await chatAPI.adminDeleteMessage(messageId);
      setFlagged(f => f.filter(m => m.id !== messageId));
      showToast('Message deleted');
    } catch {}
    setActionLoading(null);
  }

  async function handleDismissFlag(messageId) {
    setActionLoading(messageId);
    try {
      await chatAPI.adminDismissFlag(messageId);
      setFlagged(f => f.filter(m => m.id !== messageId));
      showToast('Flag dismissed');
    } catch {}
    setActionLoading(null);
  }

  async function handleBan(profileId) {
    setActionLoading(profileId);
    try {
      const expiresAt = banDuration
        ? new Date(Date.now() + Number(banDuration) * 24 * 60 * 60 * 1000).toISOString()
        : null;
      await chatAPI.adminBanUser(profileId, { reason: banReason || 'Community guidelines violation', expiresAt });
      setUsers(u => u.map(p => p.id === profileId ? { ...p, isBanned: true, banReason: banReason } : p));
      setBanModal(null); setBanReason(''); setBanDuration('');
      showToast('User banned');
    } catch {}
    setActionLoading(null);
  }

  async function handleUnban(profileId) {
    setActionLoading(profileId);
    try {
      await chatAPI.adminUnbanUser(profileId);
      setUsers(u => u.map(p => p.id === profileId ? { ...p, isBanned: false, banReason: null } : p));
      showToast('User unbanned');
    } catch {}
    setActionLoading(null);
  }

  async function handleWarn(profileId) {
    const reason = prompt('Warning reason:');
    if (!reason) return;
    setActionLoading(profileId);
    try {
      await chatAPI.adminWarnUser(profileId, reason);
      showToast('Warning issued');
    } catch {}
    setActionLoading(null);
  }

  async function handleDisbandGroup(roomId) {
    if (!confirm('Disband this group? This cannot be undone.')) return;
    setActionLoading(roomId);
    try {
      await chatAPI.adminDisbandGroup(roomId);
      setGroups(g => g.filter(r => r.id !== roomId));
      showToast('Group disbanded');
    } catch {}
    setActionLoading(null);
  }

  async function handleSearchUsers() {
    const params = {};
    if (userSearch) params.search = userSearch;
    if (bannedFilter === 'banned') params.banned = 'true';
    try {
      const res = await chatAPI.adminUsers(params);
      setUsers(res.data?.data?.profiles || []);
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Chat Moderation</h1>
        <button onClick={loadAll} className="text-sm text-teal-600 hover:underline">Refresh</button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={MessageSquare} label="Total Messages" value={stats.totalMessages} />
            <StatCard icon={BarChart2} label="Messages Today" value={stats.messagesToday} color="blue" />
            <StatCard icon={Flag} label="Flagged (Pending)" value={stats.flaggedMessages} color="orange" />
            <StatCard icon={Users} label="Chat Users" value={stats.totalProfiles} />
            <StatCard icon={Ban} label="Banned Users" value={stats.bannedUsers} color="red" />
            <StatCard icon={Shield} label="Active Rooms" value={stats.totalRooms} />
          </div>

          {flagged.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <p className="font-semibold text-orange-800">{flagged.length} flagged message{flagged.length !== 1 ? 's' : ''} need review</p>
              </div>
              <button onClick={() => setTab('flagged')} className="text-sm font-medium text-orange-700 hover:underline">
                Review flagged content →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Flagged Messages */}
      {tab === 'flagged' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{flagged.length} flagged message{flagged.length !== 1 ? 's' : ''} pending review</p>
          {flagged.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-gray-700">No flagged messages</p>
            </div>
          )}
          {flagged.map(msg => (
            <div key={msg.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{msg.sender?.displayName}</span>
                    <span className="text-xs text-gray-400">in #{msg.room?.name}</span>
                    <span className="text-xs text-gray-400">· {new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">{msg.content}</p>
                  <div className="mt-2 text-xs text-gray-400">
                    Flagged by {Array.isArray(msg.flaggedBy) ? msg.flaggedBy.length : 0} user(s):
                    {Array.isArray(msg.flaggedBy) && msg.flaggedBy.map((f, i) => <span key={i} className="ml-1 text-orange-600">{f.reason}</span>)}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => handleDismissFlag(msg.id)} disabled={actionLoading === msg.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Dismiss
                  </button>
                  <button onClick={() => handleDeleteMessage(msg.id)} disabled={actionLoading === msg.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  <button onClick={() => setBanModal({ profileId: msg.sender?.id, displayName: msg.sender?.displayName })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition">
                    <Ban className="w-3.5 h-3.5" /> Ban User
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
              placeholder="Search display name…" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
            <select value={bannedFilter} onChange={e => setBannedFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="">All users</option>
              <option value="banned">Banned only</option>
            </select>
            <button onClick={handleSearchUsers} className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition">Search</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Messages</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(profile => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{profile.displayName}</p>
                        {profile.banReason && <p className="text-xs text-red-500">Banned: {profile.banReason}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{profile.messagesSent}</td>
                    <td className="px-4 py-3">
                      {profile.isBanned ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Banned</span>
                      ) : profile.isOnline ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Online</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Offline</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {!profile.isBanned ? (
                          <>
                            <button onClick={() => handleWarn(profile.id)} disabled={actionLoading === profile.id}
                              className="px-2.5 py-1 text-xs font-medium bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition disabled:opacity-50">
                              Warn
                            </button>
                            <button onClick={() => setBanModal({ profileId: profile.id, displayName: profile.displayName })}
                              className="px-2.5 py-1 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition">
                              Ban
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleUnban(profile.id)} disabled={actionLoading === profile.id}
                            className="px-2.5 py-1 text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg transition disabled:opacity-50">
                            Unban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Groups */}
      {tab === 'groups' && (
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                <p className="text-xs text-gray-500">{group._count?.members || 0} members · {group._count?.messages || 0} messages</p>
                {group.description && <p className="text-xs text-gray-400 truncate mt-0.5">{group.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                <span className="text-gray-400">{new Date(group.createdAt).toLocaleDateString()}</span>
                <button onClick={() => handleDisbandGroup(group.id)} disabled={actionLoading === group.id}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition disabled:opacity-50">
                  Disband
                </button>
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No active groups</div>
          )}
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ban {banModal.displayName}</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Reason</label>
                <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Community guidelines violation"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Duration (leave blank for permanent)</label>
                <select value={banDuration} onChange={e => setBanDuration(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="">Permanent</option>
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setBanModal(null); setBanReason(''); setBanDuration(''); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => handleBan(banModal.profileId)} disabled={actionLoading === banModal.profileId}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition">
                {actionLoading === banModal.profileId ? 'Banning…' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

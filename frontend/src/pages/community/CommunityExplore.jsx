import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, MapPin, Globe, Plus, Lock } from 'lucide-react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const LOCATION_IMAGES = {
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80',
  shimla: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=400&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80',
  rajasthan: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80',
  kashmir: 'https://images.unsplash.com/photo-1573143729168-4e4a1b3d7f18?w=400&q=80',
  ladakh: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80',
  northeast: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=400&q=80',
  uttarakhand: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80',
};

export function CommunityExplore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chatProfile, profileLoading } = useChat();
  const [rooms, setRooms] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', isPublic: true });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      chatAPI.getRooms(),
      user ? chatAPI.getMyGroups().catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
    ]).then(([roomsRes, groupsRes]) => {
      setRooms(roomsRes.data?.data || []);
      setMyGroups(groupsRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const publicRoom = rooms.find(r => r.type === 'public');
  const locationRooms = rooms.filter(r => r.type === 'location');

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!groupForm.name.trim()) { setCreateError('Group name is required'); return; }
    setCreating(true); setCreateError('');
    try {
      const res = await chatAPI.createGroup(groupForm);
      const room = res.data?.data;
      navigate(`/community/group/${room.id}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create group');
    } finally { setCreating(false); }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white py-14 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">TravelSphere Community</h1>
        <p className="text-teal-100 text-lg max-w-xl mx-auto mb-6">Connect with fellow travelers, share tips, and find trip buddies</p>
        {!user && (
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition">
            Sign in to join chats
          </button>
        )}
        {user && !chatProfile && (
          <button onClick={() => navigate('/community/setup')} className="px-6 py-2.5 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition">
            Create your chat profile →
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Public Chat */}
        {publicRoom && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-teal-600" /> Public Chat</h2>
            <button onClick={() => navigate('/community/public-chat')}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all p-6 text-left group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <Globe className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition">{publicRoom.name}</p>
                    <p className="text-sm text-gray-500">{publicRoom.description}</p>
                    <p className="text-xs text-teal-600 mt-1 font-medium">{publicRoom.messageCount.toLocaleString()} messages</p>
                  </div>
                </div>
                <div className="px-5 py-2 bg-teal-600 group-hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition">
                  Join Chat →
                </div>
              </div>
            </button>
          </section>
        )}

        {/* Location Rooms */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-teal-600" /> Location Chats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationRooms.map(room => (
              <button key={room.id} onClick={() => navigate(`/community/location/${room.slug}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all text-left group">
                <div className="h-36 bg-gradient-to-br from-teal-400 to-emerald-600 relative overflow-hidden">
                  {LOCATION_IMAGES[room.slug] && (
                    <img src={LOCATION_IMAGES[room.slug]} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-bold text-base">{room.location}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-teal-600 font-medium">{room.messageCount.toLocaleString()} messages</span>
                    <span className="text-xs font-semibold text-teal-700 group-hover:underline">Join →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Private Messaging */}
        {user && chatProfile && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-teal-600" /> Private Messages</h2>
            <button onClick={() => navigate('/community/messages')}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all p-5 text-left flex items-center gap-4 w-full group">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-teal-700 transition">Your Conversations</p>
                <p className="text-sm text-gray-500">Send private messages to other travelers</p>
              </div>
              <div className="ml-auto text-teal-600 font-semibold text-sm group-hover:underline">Open →</div>
            </button>
          </section>
        )}

        {/* Groups */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-teal-600" /> Travel Groups</h2>
            {user && chatProfile && (
              <button onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition">
                <Plus className="w-4 h-4" /> Create Group
              </button>
            )}
          </div>

          {myGroups.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No groups yet</p>
              <p className="text-sm mt-1">{user && chatProfile ? 'Create a group to plan trips with friends' : 'Sign in to create and join travel groups'}</p>
            </div>
          )}

          {myGroups.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myGroups.map(group => (
                <button key={group.id} onClick={() => navigate(`/community/group/${group.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all p-5 text-left group flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 group-hover:text-teal-700 truncate">{group.name}</p>
                      {!group.isPublic && <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                    </div>
                    {group.description && <p className="text-xs text-gray-500 truncate mt-0.5">{group.description}</p>}
                    <p className="text-xs text-teal-600 mt-1 font-medium">{group.role} · {group.messageCount} messages</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Travel Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Group Name *</label>
                <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Manali Road Trip 2026" maxLength={50}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <textarea value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What's this group about?" rows={3} maxLength={200}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isPublic" checked={groupForm.isPublic} onChange={e => setGroupForm(f => ({ ...f, isPublic: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 rounded" />
                <label htmlFor="isPublic" className="text-sm text-gray-700">Public group (anyone can join)</label>
              </div>
              {createError && <p className="text-xs text-red-500">⚠ {createError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateGroup(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition">
                  {creating ? 'Creating…' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

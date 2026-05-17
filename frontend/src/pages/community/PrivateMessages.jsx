import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Search } from 'lucide-react';
import { chatAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { ChatRoom } from './ChatRoom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

function Avatar({ name, avatar, size = 10 }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  if (avatar) return <img src={avatar.startsWith('http') ? avatar : `${BACKEND_URL}${avatar}`} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />;
  const colors = ['bg-teal-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
  const color = colors[name?.charCodeAt(0) % colors.length] || 'bg-gray-400';
  return <div className={`w-${size} h-${size} ${color} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm`}>{initials}</div>;
}

export function PrivateMessages() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { chatProfile, profileLoading } = useChat();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!chatProfile) return;
    setLoading(true);
    chatAPI.getConversations()
      .then(r => setConversations(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chatProfile]);

  if (profileLoading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!chatProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Create a chat profile to access private messages</p>
          <button onClick={() => navigate('/community/setup')} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-500 transition">Set up profile</button>
        </div>
      </div>
    );
  }

  const filtered = conversations.filter(c => c.other?.displayName?.toLowerCase().includes(search.toLowerCase()));

  // If roomId is provided, show the chat
  if (roomId) {
    return (
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => navigate('/community')} className="p-1 text-gray-400 hover:text-gray-600"><ArrowLeft className="w-4 h-4" /></button>
              <p className="font-bold text-gray-900">Messages</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.roomId} onClick={() => navigate(`/community/messages/${c.roomId}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${c.roomId === roomId ? 'bg-teal-50 border-r-2 border-teal-500' : ''}`}>
                <div className="relative">
                  <Avatar name={c.other?.displayName} avatar={c.other?.avatar} size={10} />
                  {c.other?.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.other?.displayName || 'Unknown'}</p>
                  {c.lastMessage && <p className="text-xs text-gray-500 truncate">{c.lastMessage.content}</p>}
                </div>
                {c.lastMessage && (
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {new Date(c.lastMessage.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="p-6 text-center text-gray-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No conversations yet
              </div>
            )}
          </div>
        </div>
        {/* Chat */}
        <div className="flex-1 min-w-0">
          <ChatRoom roomId={roomId} roomType="private" />
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/community')} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white transition"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-300" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700 mb-1">No conversations yet</p>
            <p className="text-sm text-gray-500">Click on a user in public chat to start a private conversation</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filtered.map((c, i) => (
              <button key={c.roomId} onClick={() => navigate(`/community/messages/${c.roomId}`)}
                className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left ${i < filtered.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="relative">
                  <Avatar name={c.other?.displayName} avatar={c.other?.avatar} size={12} />
                  {c.other?.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{c.other?.displayName || 'Unknown'}</p>
                  {c.lastMessage && <p className="text-sm text-gray-500 truncate">{c.lastMessage.content}</p>}
                </div>
                {c.lastMessage && (
                  <span className="text-xs text-gray-400">
                    {new Date(c.lastMessage.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

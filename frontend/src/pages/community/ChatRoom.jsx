import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Send, X, Reply, Flag, Trash2, Smile, Users, ChevronDown, Settings, ArrowLeft } from 'lucide-react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
const BACKEND_URL = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

function Avatar({ name, avatar, size = 8 }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  if (avatar) return <img src={avatar.startsWith('http') ? avatar : `${BACKEND_URL}${avatar}`} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />;
  const colors = ['bg-teal-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  const color = colors[name?.charCodeAt(0) % colors.length] || 'bg-gray-400';
  return <div className={`w-${size} h-${size} ${color} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}>{initials}</div>;
}

function MessageBubble({ msg, myProfileId, onReply, onReact, onFlag, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const isOwn = msg.senderId === myProfileId;

  const reactionGroups = {};
  (msg.reactions || []).forEach(r => {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
    reactionGroups[r.emoji].push(r.userId);
  });

  if (msg.isDeleted) {
    return (
      <div className={`flex gap-2 mb-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 flex-shrink-0" />
        <span className="text-xs text-gray-400 italic px-3 py-1.5 bg-gray-100 rounded-xl">Message deleted</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 mb-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar name={msg.senderName} avatar={msg.senderAvatar} size={8} />
      <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name */}
        {!isOwn && <span className="text-xs font-semibold text-teal-700 mb-0.5 px-1">{msg.senderName}</span>}

        {/* Reply preview */}
        {msg.replyTo && !msg.replyTo.isDeleted && (
          <div className={`mb-1 px-2 py-1 border-l-2 border-teal-400 bg-teal-50 rounded text-xs text-gray-600 max-w-full ${isOwn ? 'self-end' : ''}`}>
            <span className="font-medium text-teal-700">{msg.replyTo.senderName}</span>: {msg.replyTo.content.slice(0, 80)}{msg.replyTo.content.length > 80 ? '…' : ''}
          </div>
        )}

        <div className="relative">
          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words cursor-pointer
            ${isOwn ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}
            onClick={() => setShowMenu(s => !s)}>
            {msg.content}
          </div>

          {/* Context menu */}
          {showMenu && (
            <div className={`absolute top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[130px] ${isOwn ? 'right-0' : 'left-0'}`}>
              <button onClick={() => { onReply(msg); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                <Reply className="w-3.5 h-3.5" /> Reply
              </button>
              <button onClick={() => { setShowReactions(s => !s); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                <Smile className="w-3.5 h-3.5" /> React
              </button>
              {!isOwn && (
                <button onClick={() => { onFlag(msg.id); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              )}
              {isOwn && (
                <button onClick={() => { onDelete(msg.id); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
              <button onClick={() => setShowMenu(false)} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50">
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
          )}

          {/* Emoji picker */}
          {showReactions && (
            <div className={`absolute top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-gray-100 px-2 py-1.5 flex gap-1 ${isOwn ? 'right-0' : 'left-0'}`}>
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => { onReact(msg.id, emoji); setShowReactions(false); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-lg transition">
                  {emoji}
                </button>
              ))}
              <button onClick={() => setShowReactions(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionGroups).map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition ${users.includes(myProfileId) ? 'bg-teal-100 border-teal-300 text-teal-700' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}>
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}

        <span className="text-[10px] text-gray-400 mt-0.5 px-1">
          {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          {msg.isEdited && <span className="ml-1 italic">(edited)</span>}
        </span>
      </div>
    </div>
  );
}

export function ChatRoom({ roomSlug, roomId: propRoomId, roomType = 'public' }) {
  const { slug, roomId: paramRoomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chatProfile, profileLoading, messages: ctxMessages, connected, joinRoom, leaveRoom, sendMessage, sendTypingStart, sendTypingStop, addReaction, flagMessage, deleteMessage, markRead, loadMessages, loadOnlineUsers, onlineUsers, typing } = useChat();

  const effectiveSlug = roomSlug || slug || (roomType === 'public' ? 'public' : null);
  const effectiveRoomId = propRoomId || paramRoomId || null;

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomId, setRoomId] = useState(effectiveRoomId);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showOnlineList, setShowOnlineList] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const messages = roomId ? (ctxMessages[roomId] || []) : [];
  const online = roomId ? (onlineUsers[roomId] || []) : [];
  const typingInRoom = roomId ? Object.entries(typing[roomId] || {}).filter(([, name]) => name).map(([, name]) => name) : [];

  // Fetch room info
  useEffect(() => {
    if (!effectiveSlug && !effectiveRoomId) return;
    setRoomLoading(true);
    const doFetch = effectiveRoomId
      ? chatAPI.getRooms().then(r => {
          const all = r.data?.data || [];
          const found = all.find(rm => rm.id === effectiveRoomId);
          // If not found in public list (private/group), return a stub
          return { data: { data: found || { id: effectiveRoomId, name: 'Chat Room', description: '' } } };
        })
      : chatAPI.getRoomBySlug(effectiveSlug);
    doFetch.then(r => {
      const rm = r.data?.data;
      setRoom(rm);
      if (rm?.id) setRoomId(rm.id);
    }).catch(() => navigate('/community')).finally(() => setRoomLoading(false));
  }, [effectiveSlug, effectiveRoomId]);

  // Join room + load messages when room is ready and user has profile
  useEffect(() => {
    if (!roomId || !chatProfile || !connected) return;
    joinRoom(roomId);
    loadMessages(roomId);
    loadOnlineUsers(roomId);
    return () => { leaveRoom(roomId); };
  }, [roomId, chatProfile, connected]);

  // Auto scroll
  useEffect(() => {
    if (atBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

  function handleInput(e) {
    setInput(e.target.value);
    clearTimeout(typingTimeoutRef.current);
    if (e.target.value.trim()) {
      sendTypingStart(roomId);
      typingTimeoutRef.current = setTimeout(() => sendTypingStop(roomId), 3000);
    } else {
      sendTypingStop(roomId);
    }
  }

  function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || !roomId) return;
    sendMessage(roomId, input.trim(), replyTo?.id || null);
    setInput('');
    setReplyTo(null);
    sendTypingStop(roomId);
    markRead(roomId);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  if (profileLoading || roomLoading) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!chatProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-sm p-8">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-teal-600" /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Create your chat profile</h2>
          <p className="text-gray-500 text-sm mb-6">Choose a display name to join the conversation</p>
          <button onClick={() => navigate('/community/setup')} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition">
            Set up profile →
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Room not found.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/community')} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{room.name}</p>
            <p className="text-xs text-gray-500 truncate">{room.description}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">{online.length} online</span>
          </div>
          <button onClick={() => setShowOnlineList(s => !s)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition md:hidden">
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={messagesAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              <span className="text-4xl mb-3">💬</span>
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              myProfileId={chatProfile.id}
              onReply={setReplyTo}
              onReact={(msgId, emoji) => addReaction(msgId, emoji)}
              onFlag={(msgId) => flagMessage(msgId, 'inappropriate')}
              onDelete={(msgId) => deleteMessage(msgId)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingInRoom.length > 0 && (
          <div className="px-4 py-1 text-xs text-gray-500 flex items-center gap-1.5 flex-shrink-0">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            {typingInRoom.slice(0, 2).join(', ')} {typingInRoom.length === 1 ? 'is' : 'are'} typing…
          </div>
        )}

        {/* Scroll to bottom */}
        {!atBottom && (
          <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-28 right-8 bg-teal-600 text-white rounded-full p-2 shadow-lg hover:bg-teal-500 transition z-10">
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className="px-4 py-2 bg-teal-50 border-t border-teal-100 flex items-center justify-between flex-shrink-0">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-teal-700">Replying to {replyTo.senderName}</p>
              <p className="text-xs text-gray-600 truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-2 flex-shrink-0">
          <textarea
            value={input} onChange={handleInput} onKeyDown={handleKeyDown}
            placeholder={`Message #${room.name}…`} rows={1} maxLength={2000}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 max-h-28 overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'; }}
          />
          <button onClick={handleSend} disabled={!input.trim()}
            className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl transition flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 pb-1 flex-shrink-0">Enter to send · Shift+Enter for new line</p>
      </div>

      {/* Online users sidebar */}
      <div className={`w-56 bg-white border-l border-gray-200 flex-col overflow-y-auto hidden md:flex flex-shrink-0`}>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Online — {online.length}</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {online.map(u => (
            <div key={u.profileId} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 group cursor-default">
              <div className="relative">
                <Avatar name={u.displayName} avatar={u.avatar} size={7} />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
              </div>
              <span className="text-xs text-gray-700 truncate flex-1">{u.displayName}</span>
              <button onClick={async () => {
                try {
                  const res = await chatAPI.startPrivateChat(u.profileId);
                  navigate(`/community/messages/${res.data?.data?.id}`);
                } catch {}
              }} className="hidden group-hover:block p-1 text-teal-500 hover:text-teal-700 transition text-[10px]">
                DM
              </button>
            </div>
          ))}
          {online.length === 0 && <p className="text-xs text-gray-400 px-4 py-3">No one online right now</p>}
        </div>
      </div>
    </div>
  );
}

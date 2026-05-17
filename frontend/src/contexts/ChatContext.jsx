import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { chatAPI } from '../services/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [chatProfile, setChatProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // messages: { [roomId]: Message[] }
  const [messages, setMessages] = useState({});
  // onlineUsers: { [roomId]: OnlineUser[] }
  const [onlineUsers, setOnlineUsers] = useState({});
  // typing: { [roomId]: { [profileId]: boolean } }
  const [typing, setTyping] = useState({});
  const typingTimeouts = useRef({});

  // Fetch chat profile
  useEffect(() => {
    if (!user) { setProfileLoading(false); setChatProfile(null); return; }
    setProfileLoading(true);
    chatAPI.getMyProfile()
      .then(r => setChatProfile(r.data?.data || null))
      .catch(() => setChatProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user]);

  // Connect socket when profile exists
  useEffect(() => {
    if (!chatProfile || !user) return;
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('message-received', (msg) => {
      setMessages(prev => ({
        ...prev,
        [msg.roomId]: [...(prev[msg.roomId] || []), msg],
      }));
    });

    socket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => {
        const updated = {};
        for (const roomId in prev) {
          updated[roomId] = prev[roomId].map(m =>
            m.id === messageId ? { ...m, isDeleted: true, content: '[Message deleted]' } : m
          );
        }
        return updated;
      });
    });

    socket.on('reaction-updated', ({ messageId, reactions }) => {
      setMessages(prev => {
        const updated = {};
        for (const roomId in prev) {
          updated[roomId] = prev[roomId].map(m => m.id === messageId ? { ...m, reactions } : m);
        }
        return updated;
      });
    });

    socket.on('user-joined', ({ roomId, ...userInfo }) => {
      setOnlineUsers(prev => {
        const room = prev[roomId] || [];
        if (room.some(u => u.profileId === userInfo.profileId)) return prev;
        return { ...prev, [roomId]: [...room, userInfo] };
      });
    });

    socket.on('user-left', ({ roomId, profileId }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter(u => u.profileId !== profileId),
      }));
      setTyping(prev => {
        const room = { ...(prev[roomId] || {}) };
        delete room[profileId];
        return { ...prev, [roomId]: room };
      });
    });

    socket.on('online-users', (users) => {
      // Emitted right after join-room with the full online list for that room
      // We'll handle this per-room in useChat
    });

    socket.on('user-typing', ({ roomId, profileId, displayName, typing: isTyping }) => {
      setTyping(prev => ({
        ...prev,
        [roomId]: { ...(prev[roomId] || {}), [profileId]: isTyping ? displayName : null },
      }));
      if (isTyping) {
        clearTimeout(typingTimeouts.current[`${roomId}-${profileId}`]);
        typingTimeouts.current[`${roomId}-${profileId}`] = setTimeout(() => {
          setTyping(prev => {
            const room = { ...(prev[roomId] || {}) };
            delete room[profileId];
            return { ...prev, [roomId]: room };
          });
        }, 4000);
      }
    });

    socket.on('user-banned', () => {
      setConnected(false);
      socket.disconnect();
    });

    socket.on('room-disbanded', ({ roomId }) => {
      setMessages(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [chatProfile, user]);

  const joinRoom = useCallback((roomId) => {
    socketRef.current?.emit('join-room', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId) => {
    socketRef.current?.emit('leave-room', { roomId });
  }, []);

  const sendMessage = useCallback((roomId, content, replyToId = null) => {
    socketRef.current?.emit('send-message', { roomId, content, replyToId });
  }, []);

  const sendTypingStart = useCallback((roomId) => {
    socketRef.current?.emit('typing-start', { roomId });
  }, []);

  const sendTypingStop = useCallback((roomId) => {
    socketRef.current?.emit('typing-stop', { roomId });
  }, []);

  const addReaction = useCallback((messageId, emoji) => {
    socketRef.current?.emit('add-reaction', { messageId, emoji });
  }, []);

  const flagMessage = useCallback((messageId, reason) => {
    socketRef.current?.emit('flag-message', { messageId, reason });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    socketRef.current?.emit('delete-message', { messageId });
  }, []);

  const markRead = useCallback((roomId) => {
    socketRef.current?.emit('message-read', { roomId });
  }, []);

  const loadMessages = useCallback(async (roomId, page = 1) => {
    try {
      const res = await chatAPI.getMessages(roomId, page);
      const msgs = res.data?.data || [];
      setMessages(prev => ({
        ...prev,
        [roomId]: page === 1 ? msgs : [...msgs, ...(prev[roomId] || [])],
      }));
      return msgs;
    } catch { return []; }
  }, []);

  const loadOnlineUsers = useCallback(async (roomId) => {
    try {
      const res = await chatAPI.getOnlineUsers(roomId);
      setOnlineUsers(prev => ({ ...prev, [roomId]: res.data?.data || [] }));
    } catch {}
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const r = await chatAPI.getMyProfile();
      setChatProfile(r.data?.data || null);
    } catch {}
  }, []);

  return (
    <ChatContext.Provider value={{
      socket: socketRef.current,
      connected,
      chatProfile,
      profileLoading,
      setChatProfile,
      messages,
      setMessages,
      onlineUsers,
      setOnlineUsers,
      typing,
      joinRoom,
      leaveRoom,
      sendMessage,
      sendTypingStart,
      sendTypingStop,
      addReaction,
      flagMessage,
      deleteMessage,
      markRead,
      loadMessages,
      loadOnlineUsers,
      refreshProfile,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, X, Send, Minimize2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

const QUICK_ACTIONS = [
  'Best packages this season',
  'How to book?',
  'Plan a 5-day trip to Goa',
  'Cancellation policy',
];

const AUTO_GREETINGS = [
  "Hi there! 👋 Where do you want to travel?",
  "Hello! 🌏 Planning a trip? I can help!",
  "Hey! ✈️ Ask me anything about your next adventure.",
];

function genSessionId() {
  return `widget_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function ChatbotWidget() {
  const { user } = useAuth();
  const token = sessionStorage.getItem('authToken');
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Wanderly, your AI travel assistant ✈️ How can I help you plan your next adventure?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [autoPrompt, setAutoPrompt] = useState(null);
  const [sessionId] = useState(genSessionId);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Auto greeting bubble after 12s
  useEffect(() => {
    const t = setTimeout(() => {
      if (!open) setAutoPrompt(AUTO_GREETINGS[Math.floor(Math.random() * AUTO_GREETINGS.length)]);
    }, 12000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { if (open) setAutoPrompt(null); }, [open]);

  useEffect(() => {
    if (open && !minimized) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [messages, open, minimized]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    const placeholder = { role: 'assistant', content: '', isStreaming: true };
    setMessages((prev) => [...prev, userMsg, placeholder]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${BACKEND_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: msg, sessionId, type: 'homepage-widget', history }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'delta') {
              accumulated += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: accumulated, isStreaming: true };
                return updated;
              });
            } else if (parsed.type === 'done' || parsed.type === 'error') {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: parsed.type === 'error' ? parsed.message : accumulated,
                  isStreaming: false,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: "Sorry, I'm having trouble connecting. Try again in a moment!",
            isStreaming: false,
          };
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      if (!open || minimized) setHasUnread(true);
    }
  }

  const showQuickActions = messages.length <= 1;

  return (
    <>
      {/* Auto-greeting bubble */}
      {autoPrompt && !open && (
        <div className="fixed bottom-24 right-6 z-50 w-[270px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700/60 p-4 animate-slide-in">
          <button onClick={() => setAutoPrompt(null)}
            className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center flex-shrink-0">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">Wanderly</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> AI Assistant
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{autoPrompt}</p>
          <button onClick={() => { setOpen(true); setMinimized(false); setAutoPrompt(null); }}
            className="w-full py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-sm font-semibold rounded-xl transition">
            Chat with Wanderly →
          </button>
        </div>
      )}

      {/* Chat window */}
      {open && !minimized && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[370px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col overflow-hidden"
          style={{ maxHeight: '520px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Wanderly</p>
                <p className="text-teal-100 text-xs mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> AI Travel Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('/trip-planner')}
                className="p-1.5 hover:bg-white/20 rounded-lg transition text-white/80 hover:text-white"
                title="Open full Trip Planner">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition" aria-label="Minimize">
                <Minimize2 className="w-3.5 h-3.5 text-white" />
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition" aria-label="Close">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Compass className="w-3 h-3 text-teal-600" />
                  </div>
                )}
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-headings:text-slate-800">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <button
                              onClick={() => { navigate(href); setOpen(false); }}
                              className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold underline decoration-teal-300 hover:text-teal-700 transition-colors cursor-pointer bg-transparent border-0 p-0 text-sm"
                            >
                              {children}
                            </button>
                          ),
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  {msg.isStreaming && (
                    <span className="inline-block w-1 h-3.5 bg-teal-500 ml-0.5 animate-pulse rounded-sm" />
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <Compass className="w-3 h-3 text-teal-600" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          {showQuickActions && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((label) => (
                <button key={label} onClick={() => send(label)}
                  className="px-2.5 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium
                    hover:bg-teal-100 dark:hover:bg-teal-900/50 transition border border-teal-100 dark:border-teal-800">
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-slate-100 dark:border-slate-700/60 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your next trip..."
              className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
            <button type="submit" disabled={!input.trim() || isLoading}
              className="p-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg transition flex-shrink-0">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-slate-400"><span className="text-teal-500 font-medium">Wanderly AI</span> · TravelSphere</p>
            <button onClick={() => navigate('/trip-planner')}
              className="text-xs text-teal-600 hover:underline font-medium">
              Full Trip Planner →
            </button>
          </div>
        </div>
      )}

      {/* Trigger bubble */}
      <button
        onClick={() => {
          if (open && !minimized) { setOpen(false); }
          else { setOpen(true); setMinimized(false); setHasUnread(false); setAutoPrompt(null); }
        }}
        aria-label="Open Wanderly AI travel assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full shadow-lg
          shadow-teal-400/30 hover:scale-110 hover:shadow-xl hover:shadow-teal-400/40 transition-all duration-200 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-20" />
        {open && !minimized ? (
          <X className="w-6 h-6 text-white relative z-10" />
        ) : (
          <Compass className="w-6 h-6 text-white relative z-10" />
        )}
        {hasUnread && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10" />
        )}
      </button>
    </>
  );
}

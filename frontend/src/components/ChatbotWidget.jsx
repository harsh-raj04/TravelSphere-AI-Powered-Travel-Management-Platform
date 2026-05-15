import { useState, useRef, useEffect } from 'react';
import { Compass, X, Send, Minimize2 } from 'lucide-react';

const QUICK_ACTIONS = [
  'Plan a trip',
  'Browse packages',
  'How to book',
  'Cancellation policy',
];

function getAutoReply(text) {
  const t = text.toLowerCase();
  if (t.includes('book') || t.includes('how to book'))
    return "Booking is simple! Browse our packages → pick dates & travelers → click \"Book Now\" → pay securely. You'll get instant confirmation on your email.";
  if (t.includes('cancel') || t.includes('refund'))
    return 'Cancellations 30+ days before travel: 10% charge. 15–30 days: 25%. 7–15 days: 50%. Under 7 days: non-refundable. Refunds are processed within 5–7 business days.';
  if (t.includes('payment') || t.includes('pay') || t.includes('upi'))
    return 'We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards, and net banking. All payments are secured by Razorpay.';
  if (t.includes('browse package') || t.includes('package'))
    return 'We have 200+ curated packages across 50+ destinations in India! You can filter by category, destination, or budget on our packages page.';
  if (t.includes('plan') || t.includes('trip') || t.includes('tour'))
    return "I'd love to help you plan! Tell me your destination, budget, and travel dates — I'll point you to the best packages. Or try our AI Trip Planner for a full itinerary.";
  if (/manali|shimla|kashmir|ladakh|goa|kerala|rajasthan|uttarakhand|northeast/.test(t))
    return `Great choice! We have some wonderful packages for that destination. Head over to our Packages page and search by destination to explore your options.`;
  if (t.includes('contact') || t.includes('support') || t.includes('help'))
    return 'Our support team is available Mon–Sat, 9AM–7PM IST. Reach us at support@travelsphere.dev or call +91 7992336832.';
  if (t.includes('customize') || t.includes('custom'))
    return 'Yes! You can request a fully customized package. Go to "Customize Package" in the navbar and tell us your preferences — our team will build an itinerary for you.';
  return "That's a great question! For detailed trip recommendations, browse our curated packages or reach our team at support@travelsphere.dev. I'm here for quick queries!";
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi! I'm Explore, your AI travel assistant ✈️ How can I help you plan your next adventure?",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && !minimized) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [messages, open, minimized]);

  function send(text) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: text.trim() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = getAutoReply(text);
      setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
      setTyping(false);
      if (!open || minimized) setHasUnread(true);
    }, 800);
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  const showQuickActions = messages.length <= 1;

  return (
    <>
      {/* Chat window */}
      {open && !minimized && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[360px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">Explore</p>
                <p className="text-teal-100 text-xs mt-0.5">AI Travel Assistant</p>
              </div>
              <span className="ml-1 flex items-center gap-1 text-xs text-teal-200">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Online
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                aria-label="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="overflow-y-auto p-4 space-y-3 max-h-72 flex flex-col">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Compass className="w-3 h-3 text-teal-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-tr-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
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
                <button
                  key={label}
                  onClick={() => send(label)}
                  className="px-2.5 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium hover:bg-teal-100 dark:hover:bg-teal-900/50 transition border border-teal-100 dark:border-teal-800"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-100 dark:border-slate-700/60 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your next trip..."
              className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg transition flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-center flex-shrink-0">
            <p className="text-xs text-slate-400">
              Powered by <span className="text-teal-500 font-medium">Explore AI</span> · TravelSphere
            </p>
          </div>
        </div>
      )}

      {/* Trigger bubble */}
      <button
        onClick={() => {
          if (open && !minimized) {
            setOpen(false);
          } else {
            setOpen(true);
            setMinimized(false);
            setHasUnread(false);
          }
        }}
        aria-label="Open Explore AI travel assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full shadow-lg shadow-teal-400/30 hover:scale-110 hover:shadow-xl hover:shadow-teal-400/40 transition-all duration-200 flex items-center justify-center"
      >
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

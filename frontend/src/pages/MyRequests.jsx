import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList, ChevronDown, ChevronUp, Calendar, Users, MapPin,
  Banknote, Clock, CheckCircle, XCircle, AlertCircle, MailCheck,
  ThumbsUp, ThumbsDown, Send, Loader2, MessageCircle, CreditCard,
  Package, Store, UserCheck, FileText,
} from 'lucide-react';
import { customRequestsAPI } from '../services/api';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:        { label: 'Submitted',          color: 'bg-amber-100 text-amber-700',    icon: Clock,       desc: 'We\'ve received your request and will review it shortly.' },
  reviewing:      { label: 'Under Review',        color: 'bg-blue-100 text-blue-700',      icon: AlertCircle, desc: 'Our team is reviewing your requirements. Feel free to chat with us.' },
  open:           { label: 'Finding Your Agent',  color: 'bg-indigo-100 text-indigo-700',  icon: Store,       desc: 'We\'ve opened your request to our agent network.' },
  agent_assigned: { label: 'Agent Assigned',      color: 'bg-purple-100 text-purple-700',  icon: UserCheck,   desc: 'A specialist agent has been assigned. Awaiting your personalised quote.' },
  quoted:         { label: 'Quote Ready',         color: 'bg-orange-100 text-orange-700',  icon: MailCheck,   desc: 'Your quote and itinerary are ready. Review and respond below.' },
  accepted:       { label: 'Accepted — Pay Now',  color: 'bg-teal-100 text-teal-700',     icon: CreditCard,  desc: 'Great choice! Complete your payment to confirm the booking.' },
  booked:         { label: 'Booking Confirmed',   color: 'bg-green-100 text-green-700',   icon: CheckCircle, desc: 'Your trip is confirmed! Check My Bookings for details.' },
  rejected:       { label: 'Declined',            color: 'bg-red-100 text-red-700',       icon: XCircle,     desc: 'You declined this quote.' },
};

const STEPS = ['pending', 'reviewing', 'open', 'agent_assigned', 'quoted', 'accepted', 'booked'];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
      <Icon className="w-3 h-3" />{meta.label}
    </span>
  );
}

function ProgressBar({ status }) {
  const idx  = STEPS.indexOf(status);
  const pct  = idx < 0 ? 0 : Math.round(((idx + 1) / STEPS.length) * 100);
  if (status === 'rejected') return null;
  return (
    <div className="px-5 pb-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500">Progress</p>
        <p className="text-xs font-semibold text-teal-600">{pct}%</p>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Chat thread ─────────────────────────────────────────────────────────────
function ChatThread({ requestId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);

  function load(silent = false) {
    if (!silent) setLoading(true);
    customRequestsAPI.getMessages(requestId)
      .then((r) => setMessages(r.data.data?.messages || []))
      .finally(() => { if (!silent) setLoading(false); });
  }

  useEffect(() => { load(); const iv = setInterval(() => load(true), 3000); return () => clearInterval(iv); }, [requestId]);
  useEffect(() => { if (bottomRef.current) bottomRef.current.parentElement.scrollTop = bottomRef.current.parentElement.scrollHeight; }, [messages]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try { await customRequestsAPI.addMessage(requestId, text.trim()); setText(''); load(); }
    finally { setSending(false); }
  }

  return (
    <div className="border-t border-slate-100">
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Conversation with TravelSphere
        </p>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-3">
          {loading && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>}
          {!loading && messages.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-3">No messages yet. Start the conversation!</p>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderRole === 'customer';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-teal-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}`}>
                  <p>{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-teal-200' : 'text-slate-400'}`}>
                    {isMe ? 'You' : 'TravelSphere'} · {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400" />
          <button onClick={send} disabled={!text.trim() || sending}
            className="px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 transition-colors flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quote + Itinerary card ───────────────────────────────────────────────────
function QuoteCard({ req }) {
  const agent = req.bookings?.[0]?.assignedAgent;
  return (
    <div className="mx-5 mb-4 bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-orange-200 bg-orange-100/60">
        <p className="text-sm font-bold text-orange-900 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Your Custom Trip Quote
        </p>
        {agent && (
          <p className="text-xs text-orange-700 mt-0.5 flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Prepared by {agent.user?.name || 'Your Agent'}
          </p>
        )}
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-orange-700">Total Price</p>
            <p className="text-2xl font-bold text-orange-900">₹{Number(req.quotedPrice).toLocaleString('en-IN')}</p>
          </div>
          <div className="text-xs text-orange-700">
            <p>{req.adults} adult{req.adults !== 1 ? 's' : ''}{req.children > 0 ? `, ${req.children} child${req.children !== 1 ? 'ren' : ''}` : ''}</p>
            {req.duration && <p>{req.duration} nights</p>}
          </div>
        </div>
        {req.itinerary && (
          <div>
            <p className="text-xs font-semibold text-orange-800 mb-1.5">Itinerary</p>
            <div className="bg-white rounded-xl border border-orange-100 px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
              {req.itinerary}
            </div>
          </div>
        )}
        {req.adminNote && (
          <div className="bg-white/60 rounded-xl px-3 py-2 text-xs text-orange-800 italic">
            Note: {req.adminNote}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Customer action buttons ──────────────────────────────────────────────────
function CustomerActions({ req, onUpdated }) {
  const navigate  = useNavigate();
  const [busy, setBusy]     = useState(false);
  const [paying, setPaying] = useState(false);
  const [err, setErr]       = useState('');

  async function act(action) {
    setBusy(true); setErr('');
    try { await customRequestsAPI.respond(req.id, action); onUpdated(); }
    catch (e) { setErr(e.response?.data?.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  async function handlePay() {
    setPaying(true); setErr('');
    try {
      const { data } = await customRequestsAPI.createOrder(req.id);
      const order    = data.data;
      const options  = {
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        'TravelSphere',
        description: `Custom Trip — ${req.destination}`,
        order_id:    order.order_id,
        handler: async (response) => {
          try {
            await customRequestsAPI.verifyPayment(req.id, {
              razorpay_order_id:  response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onUpdated();
            navigate('/bookings');
          } catch { setErr('Payment succeeded but booking creation failed. Contact support.'); }
        },
        prefill: { name: req.name, email: req.email, contact: req.phone || '' },
        theme: { color: '#0d9488' },
        modal: { ondismiss: () => setPaying(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { setErr('Payment failed. Please try again.'); setPaying(false); });
      rzp.open();
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Could not initiate payment.');
      setPaying(false);
    }
  }

  if (req.status === 'quoted') {
    return (
      <div className="px-5 pb-5 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => act('accept')} disabled={busy}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-60 transition-colors shadow-md">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
            Accept Quote
          </button>
          <button onClick={() => act('reject')} disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold disabled:opacity-60 transition-colors">
            <ThumbsDown className="w-3.5 h-3.5" /> Decline
          </button>
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <p className="text-xs text-slate-400">Chat above to ask questions before deciding.</p>
      </div>
    );
  }

  if (req.status === 'accepted') {
    return (
      <div className="px-5 pb-5 space-y-3">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-teal-800 mb-1">Complete Your Booking</p>
          <p className="text-xs text-teal-700">Pay ₹{Number(req.quotedPrice).toLocaleString('en-IN')} to confirm your trip to <strong>{req.destination}</strong>.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePay} disabled={paying}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-60 transition-colors shadow-md">
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {paying ? 'Opening payment…' : `Pay ₹${Number(req.quotedPrice).toLocaleString('en-IN')}`}
          </button>
          <button onClick={() => act('reject')} disabled={busy || paying}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold disabled:opacity-60 transition-colors">
            <ThumbsDown className="w-3.5 h-3.5" /> Decline
          </button>
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
      </div>
    );
  }

  return null;
}

// ─── Request card ─────────────────────────────────────────────────────────────
function RequestCard({ req, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const interests = Array.isArray(req.interests) ? req.interests : [];
  const meta      = STATUS_META[req.status] || STATUS_META.pending;
  const agent     = req.bookings?.[0]?.assignedAgent;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono text-slate-400">{req.requestNumber}</span>
            <StatusBadge status={req.status} />
          </div>
          <h3 className="text-base font-bold text-slate-900 truncate">{req.destination}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {req.quotedPrice && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Quoted</p>
              <p className="text-sm font-bold text-teal-600">₹{Number(req.quotedPrice).toLocaleString('en-IN')}</p>
            </div>
          )}
          <button onClick={() => setExpanded((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Agent badge */}
      {agent && (
        <div className="px-5 pb-2">
          <span className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
            <UserCheck className="w-3 h-3" /> Your agent: <strong>{agent.user?.name}</strong>
          </span>
        </div>
      )}

      {/* Summary row */}
      <div className="flex gap-4 px-5 pb-3 flex-wrap">
        {req.departureDate && <div className="flex items-center gap-1.5 text-xs text-slate-600"><Calendar className="w-3.5 h-3.5 text-teal-500" />{req.departureDate}</div>}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Users className="w-3.5 h-3.5 text-teal-500" />
          {req.adults} adult{req.adults !== 1 ? 's' : ''}{req.children > 0 ? `, ${req.children} child${req.children !== 1 ? 'ren' : ''}` : ''}
        </div>
        {req.duration && <div className="flex items-center gap-1.5 text-xs text-slate-600"><Clock className="w-3.5 h-3.5 text-teal-500" />{req.duration} nights</div>}
        {req.budget   && <div className="flex items-center gap-1.5 text-xs text-slate-600"><Banknote className="w-3.5 h-3.5 text-teal-500" />{req.budget}</div>}
      </div>

      {/* Progress bar */}
      <ProgressBar status={req.status} />

      {/* Expanded */}
      {expanded && (
        <>
          {/* Trip details */}
          <div className="border-t border-slate-100 px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {req.tripType      && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Trip Type</p><p className="text-slate-800 capitalize">{req.tripType.replace(/_/g, ' ')}</p></div>}
              {req.accommodation && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Stay</p><p className="text-slate-800 capitalize">{req.accommodation.replace(/_/g, ' ')}</p></div>}
              {req.mealPlan      && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Meals</p><p className="text-slate-800 capitalize">{req.mealPlan.replace(/_/g, ' ')}</p></div>}
              {req.transport     && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Transport</p><p className="text-slate-800 capitalize">{req.transport.replace(/_/g, ' ')}</p></div>}
            </div>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {interests.map((i) => (
                  <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium capitalize">{i.replace(/_/g, ' ')}</span>
                ))}
              </div>
            )}
            {req.specialRequests && (
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{req.specialRequests}</p>
            )}
          </div>

          {/* Quote card (when quoted/accepted) */}
          {['quoted', 'accepted'].includes(req.status) && req.quotedPrice && (
            <QuoteCard req={req} />
          )}

          {/* Booking confirmed */}
          {req.status === 'booked' && (
            <div className="mx-5 mb-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Booking Confirmed!</p>
                <Link to="/bookings" className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-0.5">
                  <Package className="w-3 h-3" /> View in My Bookings
                </Link>
              </div>
            </div>
          )}

          {/* Chat */}
          <ChatThread requestId={req.id} />

          {/* Customer actions */}
          {['quoted', 'accepted'].includes(req.status) && (
            <div className="border-t border-slate-100 pt-4">
              <CustomerActions req={req} onUpdated={onUpdated} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!document.getElementById('razorpay-script')) {
      const s = document.createElement('script');
      s.id = 'razorpay-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  function load() {
    customRequestsAPI.getMyRequests()
      .then((r) => setRequests(r.data.data?.requests || []))
      .catch(() => setError('Failed to load your requests.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-[#F0FDFA] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Custom Trip Requests</h1>
            <p className="text-sm text-slate-500">Track your personalised trip from request to booking</p>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2].map((n) => <div key={n} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600">{error}</div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No requests yet</h3>
            <p className="text-slate-500 text-sm mb-6">Tell us your dream trip and we'll craft a personalised package.</p>
            <Link to="/customize-package"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
              Create a Custom Request
            </Link>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
              <Link to="/customize-package" className="text-sm font-semibold text-teal-600 hover:underline">+ New Request</Link>
            </div>
            <div className="space-y-4">
              {requests.map((req) => <RequestCard key={req.id} req={req} onUpdated={load} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

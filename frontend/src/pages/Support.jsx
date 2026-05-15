import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supportAPI, bookingsAPI } from '../services/api';
import {
  HelpCircle, MessageSquare, Phone, Mail, Plus, Search,
  ChevronDown, ChevronRight, X, Send, Loader2, LifeBuoy,
  MessageCircle, RefreshCw, XCircle,
} from 'lucide-react';

const ISSUE_TYPES = [
  { value: 'booking_issue', label: 'Booking Issue' },
  { value: 'payment_problem', label: 'Payment Problem' },
  { value: 'itinerary_change', label: 'Itinerary Change Request' },
  { value: 'agent_complaint', label: 'Agent Complaint' },
  { value: 'refund_request', label: 'Refund Request' },
  { value: 'cancellation', label: 'Cancellation Request' },
  { value: 'general_inquiry', label: 'General Inquiry' },
  { value: 'technical_issue', label: 'Technical Issue' },
  { value: 'feature_request', label: 'Feature Request / Suggestion' },
  { value: 'other', label: 'Other' },
];

const FAQ_ITEMS = [
  {
    q: 'How do I cancel or modify my booking?',
    a: 'To cancel a booking, go to My Bookings, select the booking, and use the cancellation option. Modifications must be requested through our support team via a ticket. Cancellation policies vary by package — check your booking details for applicable charges.',
  },
  {
    q: 'When will I receive my refund?',
    a: 'Refunds for cancelled bookings are processed within 7–10 business days to your original payment method. The timing depends on your bank or card issuer. For Razorpay payments, refunds typically appear within 5–7 days.',
  },
  {
    q: 'How do I contact my assigned travel agent?',
    a: 'Once your booking is confirmed and an agent is assigned, their contact email will be visible in your booking details under the "Support" tab. You can email the agent directly from your booking page.',
  },
  {
    q: 'What documents do I need to carry for my trip?',
    a: 'Please carry a valid government-issued photo ID (Aadhaar, Passport, or Voter ID), your booking confirmation email, and any e-tickets or hotel vouchers provided by your agent. For international trips, your passport and visa are mandatory.',
  },
  {
    q: 'My payment was deducted but booking not confirmed — what should I do?',
    a: 'This can happen due to a network interruption during payment. Please wait 15 minutes and refresh your bookings page. If the booking is still not confirmed, open a support ticket with "Payment Problem" as the issue type and include your transaction reference number.',
  },
  {
    q: 'Can I book a trip for someone else?',
    a: 'Yes, you can book for family members or friends. During booking, provide the traveller details of the person travelling. The payment can be made from your account.',
  },
];

function statusConfig(status) {
  switch (status) {
    case 'open':        return { label: 'Open',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',   dot: 'bg-blue-500' };
    case 'in_progress': return { label: 'In Progress',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' };
    case 'waiting':     return { label: 'Waiting',      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500' };
    case 'resolved':    return { label: 'Resolved',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   dot: 'bg-green-500' };
    case 'closed':      return { label: 'Closed',       color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',      dot: 'bg-slate-400' };
    default:            return { label: status,         color: 'bg-slate-100 text-slate-600',                                             dot: 'bg-slate-400' };
  }
}

function priorityConfig(priority) {
  switch (priority) {
    case 'urgent': return { label: 'Urgent', color: 'text-red-600 dark:text-red-400' };
    case 'high':   return { label: 'High',   color: 'text-orange-600 dark:text-orange-400' };
    case 'medium': return { label: 'Medium', color: 'text-amber-600 dark:text-amber-400' };
    case 'low':    return { label: 'Low',    color: 'text-green-600 dark:text-green-400' };
    default:       return { label: priority, color: 'text-slate-500' };
  }
}

function isActive(status) {
  return ['open', 'in_progress', 'waiting'].includes(status);
}

function formatTime(dt) {
  const d = new Date(dt);
  const diffMins = Math.floor((Date.now() - d) / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── FAQ Accordion ──────────────────────────────────────────────────────────────
function FaqAccordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 pr-4">{item.q}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="px-5 pb-4 pt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700/40">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Create Ticket Modal ────────────────────────────────────────────────────────
function CreateTicketModal({ bookings, onClose, onCreated }) {
  const [form, setForm] = useState({ issueType: '', subject: '', description: '', bookingRef: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.issueType || !form.subject.trim() || !form.description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = { issueType: form.issueType, subject: form.subject.trim(), description: form.description.trim() };
      if (form.bookingRef) payload.bookingRef = form.bookingRef;
      const res = await supportAPI.createTicket(payload);
      onCreated(res.data.data.ticket);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700/60 animate-scale-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">New Support Ticket</h2>
            <p className="text-xs text-slate-500 mt-0.5">We typically respond within 24 hours</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Issue Type <span className="text-red-500">*</span></label>
            <select
              value={form.issueType}
              onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select an issue type...</option>
              {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Brief description of your issue..."
              maxLength={120}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe your issue in detail. Include relevant dates, booking references, or error messages..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400 resize-none"
            />
          </div>

          {bookings.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Related Booking <span className="text-slate-400">(optional)</span></label>
              <select
                value={form.bookingRef}
                onChange={e => setForm(f => ({ ...f, bookingRef: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select a booking...</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.package?.title || b.id.slice(-8)} — {new Date(b.travelDate || b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-semibold hover:from-teal-500 hover:to-teal-600 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Ticket Detail Panel ────────────────────────────────────────────────────────
function TicketDetail({ ticketId, currentUser, onClose, onTicketUpdate }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadTicket(); }, [ticketId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [ticket?.messages?.length]);

  async function loadTicket() {
    setLoading(true);
    try {
      const res = await supportAPI.getTicket(ticketId);
      setTicket(res.data.data.ticket);
    } catch {
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await supportAPI.addMessage(ticketId, reply.trim());
      setTicket(t => ({ ...t, messages: [...(t?.messages || []), res.data.data.message] }));
      setReply('');
    } catch {
      // user can retry
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      await supportAPI.closeTicket(ticketId);
      setTicket(t => ({ ...t, status: 'resolved' }));
      onTicketUpdate(ticketId, 'resolved');
    } catch {
      // silently fail
    } finally {
      setClosing(false);
    }
  }

  const sc = ticket ? statusConfig(ticket.status) : null;
  const pc = ticket ? priorityConfig(ticket.priority) : null;
  const closed = ticket && !isActive(ticket.status);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 flex-shrink-0">
        {loading ? (
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : ticket ? (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{ticket.ticketNumber}</span>
              {sc && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              )}
              {pc && <span className={`text-xs font-medium ${pc.color}`}>{pc.label} priority</span>}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 truncate">{ticket.subject}</h3>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Failed to load ticket</p>
        )}
        <div className="flex items-center gap-1 ml-3 flex-shrink-0">
          <button onClick={loadTicket} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400" title="Close panel">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : !ticket ? (
          <p className="text-sm text-slate-500 text-center py-8">Unable to load messages</p>
        ) : (ticket.messages?.length === 0) ? (
          <p className="text-sm text-slate-400 text-center py-8">No messages yet</p>
        ) : (
          ticket.messages.map((msg) => {
            const isOwn = msg.senderId === currentUser?.id || msg.senderRole === 'customer';
            const fromAdmin = msg.senderRole === 'admin';
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isOwn
                    ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                }`}>
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {fromAdmin ? 'Support Team' : (msg.sender?.name || 'Agent')}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <p className={`text-xs mt-1.5 ${isOwn ? 'text-teal-200' : 'text-slate-400'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply / status bar */}
      {!loading && ticket && (
        <div className="border-t border-slate-200 dark:border-slate-700/60 px-5 py-4 flex-shrink-0">
          {closed ? (
            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
              This ticket is <span className="font-medium">{ticket.status}</span> — no further replies.
            </p>
          ) : (
            <>
              <form onSubmit={handleReply} className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
              <button
                onClick={handleClose}
                disabled={closing}
                className="mt-2 w-full text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition flex items-center justify-center gap-1.5 py-1"
              >
                {closing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                Mark as resolved
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Support Page ──────────────────────────────────────────────────────────
export function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const ticketsSectionRef = useRef(null);

  useEffect(() => {
    loadTickets();
    loadBookings();
  }, []);

  useEffect(() => {
    if (selectedId && ticketsSectionRef.current) {
      ticketsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedId]);

  async function loadTickets() {
    setTicketsLoading(true);
    try {
      const res = await supportAPI.getMyTickets();
      setTickets(res.data.data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }

  async function loadBookings() {
    try {
      const res = await bookingsAPI.myBookings();
      setBookings(res.data?.data?.items || []);
    } catch {
      // non-critical
    }
  }

  function handleTicketCreated(ticket) {
    setTickets(prev => [ticket, ...prev]);
    setSelectedId(ticket.id);
    setShowCreate(false);
  }

  function handleTicketUpdate(id, newStatus) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  }

  const filtered = tickets.filter(t => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? isActive(t.status) :
      !isActive(t.status);
    const matchSearch = !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    active: tickets.filter(t => isActive(t.status)).length,
    resolved: tickets.filter(t => !isActive(t.status)).length,
    all: tickets.length,
  };

  const filteredFaq = faqSearch
    ? FAQ_ITEMS.filter(f =>
        f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.a.toLowerCase().includes(faqSearch.toLowerCase())
      )
    : FAQ_ITEMS;

  return (
    <div className="min-h-screen bg-[#F0FDFA] dark:bg-slate-950">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-8 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-48 h-48 bg-teal-300 rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <LifeBuoy className="w-4 h-4 text-teal-300" />
            <span className="text-teal-100 text-sm font-medium">Help Center</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">How can we help you?</h1>
          <p className="text-teal-200 text-lg mb-8">Search our help articles or open a ticket — we respond within 24 hours.</p>

          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={faqSearch}
              onChange={e => setFaqSearch(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {['Cancel booking', 'Payment issue', 'Refund status', 'Contact agent'].map(q => (
              <button
                key={q}
                onClick={() => setFaqSearch(q)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Action Cards ── */}
      <section className="max-w-5xl mx-auto px-4 -mt-6 mb-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="#faq" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition group text-center block">
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition">
              <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Browse FAQ</p>
            <p className="text-xs text-slate-500 mt-0.5">Find quick answers</p>
          </a>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:from-teal-500 hover:to-teal-600 transition text-center"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-white">Open Ticket</p>
            <p className="text-xs text-teal-200 mt-0.5">Get personalised help</p>
          </button>

          <a href="mailto:support@travelsphere.in" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition group text-center block">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Email Us</p>
            <p className="text-xs text-slate-500 mt-0.5">support@travelsphere.in</p>
          </a>

          <a
            href="https://wa.me/917992336832"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-green-300 dark:hover:border-green-700 transition group text-center block"
          >
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition">
              <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">WhatsApp</p>
            <p className="text-xs text-slate-500 mt-0.5">+91 79923 36832</p>
          </a>
        </div>
      </section>

      {/* ── My Support Tickets ── */}
      <section ref={ticketsSectionRef} className="max-w-5xl mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Support Tickets</h2>
            <p className="text-sm text-slate-500 mt-0.5">{tickets.length} total ticket{tickets.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-semibold hover:from-teal-500 hover:to-teal-600 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>

        <div className={`grid gap-4 ${selectedId ? 'lg:grid-cols-[380px_1fr]' : ''}`}>
          {/* Ticket List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/40 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tickets..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>
              <div className="flex gap-1.5">
                {[
                  { key: 'active',   label: `Active (${counts.active})` },
                  { key: 'resolved', label: `Resolved (${counts.resolved})` },
                  { key: 'all',      label: `All (${counts.all})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filter === tab.key
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/40 max-h-[480px] overflow-y-auto">
              {ticketsLoading ? (
                <div className="p-8 flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                  <p className="text-sm text-slate-500">Loading tickets...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500">
                    {tickets.length === 0 ? 'No support tickets yet' : 'No tickets match your filters'}
                  </p>
                  {tickets.length === 0 && (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-3 text-sm text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Open your first ticket
                    </button>
                  )}
                </div>
              ) : (
                filtered.map(t => {
                  const sc = statusConfig(t.status);
                  const isSelected = selectedId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(isSelected ? null : t.id)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-teal-50 dark:bg-teal-900/20 border-l-2 border-teal-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono text-slate-400">{t.ticketNumber}</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{t.subject}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">{formatTime(t.updatedAt)}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {t._count?.messages || 0}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Ticket Detail Panel */}
          {selectedId && (
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col"
              style={{ minHeight: '480px', maxHeight: '600px' }}
            >
              <TicketDetail
                ticketId={selectedId}
                currentUser={user}
                onClose={() => setSelectedId(null)}
                onTicketUpdate={handleTicketUpdate}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-3xl mx-auto px-4 mb-12">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-500 mt-1">Quick answers to the most common queries</p>
        </div>
        {filteredFaq.length > 0 ? (
          <FaqAccordion items={filteredFaq} />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No FAQ matches "<span className="font-medium">{faqSearch}</span>"</p>
            <button
              onClick={() => { setShowCreate(true); setFaqSearch(''); }}
              className="mt-2 text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Open a support ticket instead
            </button>
          </div>
        )}
      </section>

      {/* ── Contact Section ── */}
      <section className="bg-gradient-to-br from-slate-900 to-teal-950 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Still need help?</h2>
          <p className="text-slate-400 mb-8">Our support team is available Monday–Saturday, 9 AM to 7 PM IST</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="mailto:support@travelsphere.in" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition group text-left block">
              <Mail className="w-8 h-8 text-teal-400 mb-3" />
              <p className="text-sm font-semibold text-white mb-1">Email Support</p>
              <p className="text-xs text-slate-400 group-hover:text-teal-300 transition">support@travelsphere.in</p>
              <p className="text-xs text-slate-500 mt-1">Response in 24h</p>
            </a>

            <a href="tel:+917992336832" className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition group text-left block">
              <Phone className="w-8 h-8 text-blue-400 mb-3" />
              <p className="text-sm font-semibold text-white mb-1">Phone Support</p>
              <p className="text-xs text-slate-400 group-hover:text-blue-300 transition">+91 79923 36832</p>
              <p className="text-xs text-slate-500 mt-1">Mon–Sat, 9AM–7PM</p>
            </a>

            <a
              href="https://wa.me/917992336832"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition group text-left block"
            >
              <MessageSquare className="w-8 h-8 text-green-400 mb-3" />
              <p className="text-sm font-semibold text-white mb-1">WhatsApp Chat</p>
              <p className="text-xs text-slate-400 group-hover:text-green-300 transition">+91 79923 36832</p>
              <p className="text-xs text-slate-500 mt-1">Typically replies in 2h</p>
            </a>
          </div>
        </div>
      </section>

      {/* Create Ticket Modal */}
      {showCreate && (
        <CreateTicketModal
          bookings={bookings}
          onClose={() => setShowCreate(false)}
          onCreated={handleTicketCreated}
        />
      )}
    </div>
  );
}

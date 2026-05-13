import { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Mail,
  Phone,
  Clock,
  MessageSquare,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Ticket,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { agentAPI } from '../../services/api';

// ─── Contact info ──────────────────────────────────────────────────────────────
const CONTACT_CARDS = [
  {
    icon: Mail,
    label: 'Email Support',
    value: 'support@travelsphere.dev',
    subText: 'We respond within 24 hours',
    href: 'mailto:support@travelsphere.dev',
    color: 'teal',
  },
  {
    icon: Phone,
    label: 'Phone Support',
    value: '+91-9773335623',
    subText: 'Mon–Fri, 9 AM – 6 PM IST',
    href: 'tel:+919773335623',
    color: 'blue',
  },
  {
    icon: Clock,
    label: 'Office Hours',
    value: 'Mon–Fri, 9 AM – 6 PM IST',
    subText: 'Closed on weekends & public holidays',
    href: null,
    color: 'purple',
  },
];

const COLOR_MAP = {
  teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600',   border: 'border-teal-100'  },
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100'  },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
};

// ─── Quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: BookOpen,      label: 'Knowledge Base',  desc: 'Browse guides & how-tos',   href: '#' },
  { icon: MessageSquare, label: 'Live Chat',        desc: 'Chat with an agent now',     href: '#' },
  { icon: HelpCircle,    label: 'FAQs',             desc: 'Common questions answered',  href: '#' },
];

// ─── FAQ items ─────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How do I get paid for completed bookings?',
    a: 'Payouts are processed every Friday for all bookings marked as completed in the previous week. Ensure you have a verified default payment method set in the Payment Methods page.',
  },
  {
    q: 'Can I cancel a booking after payment is collected?',
    a: 'Yes, but cancellation policies vary by package. Navigate to the booking detail and use the Cancel Booking option. Refunds are processed within 5–7 business days.',
  },
  {
    q: 'How do I opt into or out of a package?',
    a: 'Open the package detail page from the Packages section and use the "Express Interest" or "Opt Out" button. Opt-out is independent of any active bookings you may have for that package.',
  },
  {
    q: 'What documents are required for KYC verification?',
    a: 'You will need a valid government-issued photo ID (Aadhaar, PAN, or Passport) and an address proof. Upload these in the Documents section of your profile.',
  },
  {
    q: 'How do I update my email or phone number?',
    a: 'Go to your Profile page and click the edit icon next to your email or phone. An OTP will be sent to verify ownership of the new contact before the change is saved.',
  },
];

// ─── Issue types ───────────────────────────────────────────────────────────────
const ISSUE_TYPES = [
  { value: 'payment',   label: 'Payment / Payout Issue' },
  { value: 'booking',   label: 'Booking Problem' },
  { value: 'package',   label: 'Package / Availability' },
  { value: 'account',   label: 'Account / Profile' },
  { value: 'technical', label: 'Technical Bug' },
  { value: 'other',     label: 'Other' },
];

// ─── Helper functions ──────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:    'bg-green-100 text-green-700 border-green-200',
};

const STATUS_STYLES = {
  open:        'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved:    'bg-green-100 text-green-700 border-green-200',
  closed:      'bg-gray-100 text-gray-700 border-gray-200',
};

// ─── FaqItem ───────────────────────────────────────────────────────────────────
function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors gap-4"
      >
        <span className="text-sm font-semibold text-gray-800">{item.q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {item.a}
        </div>
      )}
    </div>
  );
}

// ─── TicketDetailModal ─────────────────────────────────────────────────────────
function TicketDetailModal({ ticket, onClose, onRefresh }) {
  const addToast = useToast();
  const [messages, setMessages] = useState(ticket?.messages ?? []);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const isClosed = ticket?.status === 'closed';

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await agentAPI.addTicketMessage(ticket.id, reply.trim());
      setMessages((prev) => [...prev, res.data?.data?.message]);
      setReply('');
      onRefresh();
    } catch {
      addToast('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await agentAPI.updateTicketStatus(ticket.id, status);
      addToast(`Ticket marked as ${status}`, 'success');
      onRefresh();
      onClose();
    } catch {
      addToast('Failed to update ticket status', 'error');
    }
  };

  if (!ticket) return null;

  return (
    <Modal isOpen onClose={onClose} title={`Ticket ${ticket.ticketNumber}`} size="full">
      {/* Ticket meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
          {ticket.status?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${PRIORITY_STYLES[ticket.priority] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
          {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
          {ISSUE_TYPES.find((t) => t.value === ticket.issueType)?.label ?? ticket.issueType}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
      <p className="text-xs text-gray-400 mb-4">Opened {formatDate(ticket.createdAt)}</p>

      {/* Status actions */}
      {(ticket.status === 'in_progress' || ticket.status === 'open') && (
        <div className="flex gap-2 mb-4">
          {ticket.status !== 'resolved' && (
            <button
              onClick={() => handleStatusChange('resolved')}
              className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-semibold hover:bg-green-100 transition-colors"
            >
              Mark Resolved
            </button>
          )}
          <button
            onClick={() => handleStatusChange('closed')}
            className="text-xs px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Close Ticket
          </button>
        </div>
      )}

      {/* Message thread */}
      <div className="space-y-3 max-h-80 overflow-y-auto pb-2 mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.senderRole === 'admin';
            return (
              <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  isAdmin
                    ? 'bg-purple-50 border border-purple-100 text-gray-800'
                    : 'bg-teal-500 text-white'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${isAdmin ? 'text-purple-700' : 'text-teal-100'}`}>
                      {msg.sender?.name ?? msg.senderRole}
                    </span>
                    <span className={`text-[10px] ${isAdmin ? 'text-gray-400' : 'text-teal-100/80'}`}>
                      {msg.senderRole === 'admin' ? 'Support' : 'You'} · {timeAgo(msg.createdAt)}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply input */}
      {!isClosed ? (
        <div className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
            rows={3}
            disabled={sending}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Reply
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          This ticket is closed. Open a new ticket if you need further assistance.
        </div>
      )}
    </Modal>
  );
}

// ─── TicketCard ────────────────────────────────────────────────────────────────
function TicketCard({ ticket, onView }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-xs font-semibold text-teal-600">{ticket.ticketNumber}</span>
          <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{ticket.subject}</p>
        </div>
        <button
          onClick={() => onView(ticket)}
          className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg font-semibold hover:bg-teal-100 transition-colors flex-shrink-0"
        >
          View
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {ticket.status?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_STYLES[ticket.priority] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
          {ISSUE_TYPES.find((t) => t.value === ticket.issueType)?.label ?? ticket.issueType}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{formatDate(ticket.createdAt)}</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {ticket._count?.messages ?? 0} messages
        </span>
      </div>
    </div>
  );
}

// ─── TicketForm ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { issueType: '', subject: '', message: '' };

function TicketForm({ onSuccess }) {
  const addToast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.issueType) errs.issueType = 'Please select an issue type';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    else if (form.subject.trim().length < 5) errs.subject = 'Subject is too short';
    if (!form.message.trim()) errs.message = 'Message is required';
    else if (form.message.trim().length < 20) errs.message = 'Please describe your issue in at least 20 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await agentAPI.createTicket({
        subject: form.subject.trim(),
        description: form.message.trim(),
        issueType: form.issueType,
      });
      const ticket = res.data?.data?.ticket;
      setCreatedTicket(ticket);
      addToast("Support ticket submitted! We'll get back to you within 24 hours.", 'success');
      onSuccess();
    } catch (err) {
      addToast(err?.response?.data?.message ?? 'Failed to submit ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdTicket) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-teal-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Ticket Submitted!</h3>
        <p className="text-sm text-gray-500 max-w-xs mb-2">
          Your ticket has been received. We'll respond within 24 hours.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg mb-6">
          <Ticket className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-mono text-sm font-bold text-teal-700">{createdTicket.ticketNumber}</span>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setCreatedTicket(null); }}
          className="text-sm text-teal-600 font-semibold hover:text-teal-700"
        >
          Submit another ticket →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Issue type */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
          Issue Type
        </label>
        <select
          value={form.issueType}
          onChange={(e) => set('issueType', e.target.value)}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
            errors.issueType
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:ring-teal-200 focus:border-teal-400'
          }`}
        >
          <option value="">Select an issue type…</option>
          {ISSUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {errors.issueType && <p className="text-red-500 text-xs mt-1">{errors.issueType}</p>}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
          Subject
        </label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => set('subject', e.target.value)}
          placeholder="Brief summary of your issue"
          className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
            errors.subject
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:ring-teal-200 focus:border-teal-400'
          }`}
        />
        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
          Message
        </label>
        <textarea
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Describe your issue in detail — include booking IDs or package names if relevant…"
          rows={5}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors resize-none ${
            errors.message
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:ring-teal-200 focus:border-teal-400'
          }`}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.message
            ? <p className="text-red-500 text-xs">{errors.message}</p>
            : <span />
          }
          <span className="text-xs text-gray-400 ml-auto">{form.message.length} chars</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-60"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : (
          <><Send className="w-4 h-4" /> Submit Ticket</>
        )}
      </button>
    </form>
  );
}

// ─── MyTickets ─────────────────────────────────────────────────────────────────
function MyTickets({ refreshKey }) {
  const addToast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agentAPI.getMyTickets();
      setTickets(res.data?.data?.tickets ?? []);
    } catch {
      addToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets, refreshKey]);

  const handleView = async (ticket) => {
    try {
      const res = await agentAPI.getTicket(ticket.id);
      setDetailTicket(res.data?.data?.ticket);
    } catch {
      addToast('Failed to load ticket details', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">My Tickets</h2>
        <button
          onClick={loadTickets}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse space-y-3">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3.5 bg-gray-200 rounded w-2/3" />
              <div className="flex gap-1.5">
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-gray-200 rounded-2xl">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
            <Ticket className="w-7 h-7 text-teal-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">No tickets yet</p>
          <p className="text-sm text-gray-400 mt-1">Submit a ticket above if you need help</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onView={handleView} />
          ))}
        </div>
      )}

      {detailTicket && (
        <TicketDetailModal
          ticket={detailTicket}
          onClose={() => setDetailTicket(null)}
          onRefresh={() => {
            loadTickets();
            // refresh detail ticket messages too
            agentAPI.getTicket(detailTicket.id)
              .then((res) => setDetailTicket(res.data?.data?.ticket))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

// ─── AgentSupport ──────────────────────────────────────────────────────────────
export function AgentSupport() {
  const [ticketsRefreshKey, setTicketsRefreshKey] = useState(0);

  return (
    <div className="p-8 space-y-8 min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <LifeBuoy className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-500 mt-1">Get help, report issues, and contact the TravelSphere support team</p>
        </div>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CONTACT_CARDS.map((card) => {
          const { bg, icon: iconCls, border } = COLOR_MAP[card.color];
          const Icon = card.icon;
          const inner = (
            <div className={`flex items-start gap-4 p-5 border rounded-2xl ${bg} ${border}`}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className={`w-5 h-5 ${iconCls}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{card.label}</p>
                <p className="text-sm font-bold text-gray-900 break-all">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.subText}</p>
              </div>
              {card.href && <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-1 ml-auto" />}
            </div>
          );

          return card.href ? (
            <a key={card.label} href={card.href} className="block hover:shadow-md transition-shadow rounded-2xl">
              {inner}
            </a>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => {}}
              className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-teal-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Two-col layout: ticket form + FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Support ticket form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Submit a Ticket</h2>
            <p className="text-sm text-gray-500 mt-0.5">Fill in the form and we'll get back to you within 24 hours</p>
          </div>
          <TicketForm onSuccess={() => setTicketsRefreshKey((k) => k + 1)} />
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-sm text-gray-500 mt-0.5">Quick answers to common questions</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} item={faq} />
            ))}
          </div>
        </div>
      </div>

      {/* My Tickets section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <MyTickets refreshKey={ticketsRefreshKey} />
      </div>

    </div>
  );
}

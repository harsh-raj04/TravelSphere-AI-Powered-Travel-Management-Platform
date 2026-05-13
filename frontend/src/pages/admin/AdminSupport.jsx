import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  RefreshCw,
  Send,
  Loader2,
  Search,
  Lock,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

// ─── Helpers ───────────────────────────────────────────────────────────────────
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
  urgent: 'bg-red-100 text-red-700 border-red-300',
  high:   'bg-orange-100 text-orange-700 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low:    'bg-green-100 text-green-700 border-green-300',
};

const STATUS_STYLES = {
  open:        'bg-blue-100 text-blue-700 border-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-300',
  resolved:    'bg-green-100 text-green-700 border-green-300',
  closed:      'bg-gray-200 text-gray-600 border-gray-300',
};

const ROLE_STYLES = {
  agent:    'bg-teal-100 text-teal-700 border-teal-300',
  customer: 'bg-blue-100 text-blue-700 border-blue-300',
  admin:    'bg-purple-100 text-purple-700 border-purple-300',
};

const ISSUE_TYPE_LABELS = {
  payment:   'Payment',
  booking:   'Booking',
  package:   'Package',
  account:   'Account',
  technical: 'Technical',
  other:     'Other',
};

// ─── TicketDetailModal ─────────────────────────────────────────────────────────
function TicketDetailModal({ ticket, onClose, onUpdate }) {
  const addToast = useToast();
  const [messages, setMessages] = useState(ticket?.messages ?? []);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(ticket?.status ?? 'open');
  const [priority, setPriority] = useState(ticket?.priority ?? 'medium');
  const [resolutionNotes, setResolutionNotes] = useState(ticket?.resolutionNotes ?? '');

  if (!ticket) return null;

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await adminAPI.adminReplyTicket(ticket.id, { message: reply.trim(), isInternal });
      setMessages((prev) => [...prev, res.data?.data?.message]);
      setReply('');
    } catch {
      addToast('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await adminAPI.adminUpdateTicket(ticket.id, { status, priority, resolutionNotes: resolutionNotes || undefined });
      addToast('Ticket updated', 'success');
      onUpdate();
    } catch {
      addToast('Failed to update ticket', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Ticket ${ticket.ticketNumber}`} size="full">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel: ticket info */}
        <div className="lg:w-2/5 space-y-5">
          {/* Meta info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Subject</p>
              <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Issue Type</p>
              <span className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                {ISSUE_TYPE_LABELS[ticket.issueType] ?? ticket.issueType}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Created</p>
              <p className="text-sm text-gray-700">{formatDate(ticket.createdAt)}</p>
            </div>
          </div>

          {/* Requester */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Requester</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{ticket.user?.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500">{ticket.user?.email ?? ''}</p>
              </div>
            </div>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_STYLES[ticket.userRole] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {ticket.userRole?.charAt(0).toUpperCase() + ticket.userRole?.slice(1)}
            </span>
          </div>

          {/* Status & Priority controls */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Update Ticket</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            {(status === 'resolved' || status === 'closed') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Resolution Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe how this was resolved…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>
            )}
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </div>

        {/* Right panel: messages */}
        <div className="lg:w-3/5 flex flex-col gap-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Conversation</p>

          {/* Message thread */}
          <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No messages yet</p>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderRole === 'admin';
                const isInternalMsg = msg.isInternal;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                      isInternalMsg
                        ? 'bg-amber-50 border border-amber-200 text-amber-900 italic'
                        : isAdmin
                        ? 'bg-purple-600 text-white'
                        : msg.senderRole === 'agent'
                        ? 'bg-white border border-teal-200 text-gray-800'
                        : 'bg-white border border-blue-200 text-gray-800'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${
                          isInternalMsg ? 'text-amber-700' : isAdmin ? 'text-purple-200' : 'text-gray-600'
                        }`}>
                          {msg.sender?.name ?? msg.senderRole}
                        </span>
                        <span className={`text-[10px] ${isAdmin && !isInternalMsg ? 'text-purple-300' : 'text-gray-400'}`}>
                          {timeAgo(msg.createdAt)}
                        </span>
                        {isInternalMsg && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                            <Lock className="w-2.5 h-2.5" /> Internal
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply input */}
          <div className="space-y-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply to the requester…"
              rows={3}
              disabled={sending}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-500"
                />
                <span className="text-xs font-medium">Internal note (not visible to requester)</span>
              </label>
              <button
                onClick={handleSend}
                disabled={sending || !reply.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── AdminSupport ──────────────────────────────────────────────────────────────
export function AdminSupport() {
  const addToast = useToast();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0, urgent: 0, high: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Detail modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'all') params.userRole = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const res = await adminAPI.adminTickets(params);
      setTickets(res.data?.data?.tickets ?? []);
      if (res.data?.data?.stats) setStats(res.data.data.stats);
    } catch {
      addToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, priorityFilter, search, addToast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleViewTicket = async (ticket) => {
    try {
      const res = await adminAPI.adminGetTicket(ticket.id);
      setSelectedTicket(res.data?.data?.ticket);
    } catch {
      addToast('Failed to load ticket details', 'error');
    }
  };

  const ROLE_TABS = [
    { id: 'all',      label: 'All' },
    { id: 'agent',    label: 'Agents' },
    { id: 'customer', label: 'Customers' },
  ];

  const STATUS_TABS = [
    { id: 'all',        label: 'All' },
    { id: 'open',       label: 'Open' },
    { id: 'in_progress',label: 'In Progress' },
    { id: 'resolved',   label: 'Resolved' },
    { id: 'closed',     label: 'Closed' },
  ];

  const PRIORITY_OPTIONS = [
    { id: 'all',    label: 'All Priorities' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'high',   label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low',    label: 'Low' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and respond to support requests</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Role filter tabs */}
          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
            {ROLE_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setRoleFilter(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  roleFilter === t.id
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={loadTickets}
            className="p-2 text-gray-400 hover:text-gray-200 bg-gray-800 rounded-lg border border-gray-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Urgent', value: stats.urgent, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${s.bg} rounded-lg`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket #, subject, or requester…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Priority dropdown */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Ticket #', 'Requester', 'Subject', 'Type', 'Priority', 'Status', 'Created', 'Updated', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading tickets…
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    No tickets found matching your filters
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    {/* Ticket # */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {ticket.ticketNumber}
                      </button>
                    </td>

                    {/* Requester */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                            {ticket.user?.name ?? 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                            {ticket.user?.email ?? ''}
                          </p>
                        </div>
                      </div>
                      <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${ROLE_STYLES[ticket.userRole] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {ticket.userRole?.charAt(0).toUpperCase() + ticket.userRole?.slice(1)}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-sm text-gray-900 dark:text-white truncate" title={ticket.subject}>
                        {ticket.subject?.slice(0, 50)}{ticket.subject?.length > 50 ? '…' : ''}
                      </p>
                    </td>

                    {/* Issue type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                        {ISSUE_TYPE_LABELS[ticket.issueType] ?? ticket.issueType}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${PRIORITY_STYLES[ticket.priority] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                        {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${STATUS_STYLES[ticket.status] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                        {ticket.status?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(ticket.createdAt)}
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {timeAgo(ticket.updatedAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
      </p>

      {/* Detail modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            loadTickets();
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
}

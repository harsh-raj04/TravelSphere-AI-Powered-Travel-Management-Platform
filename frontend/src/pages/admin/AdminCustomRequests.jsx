import { useEffect, useRef, useState } from 'react';
import {
  ClipboardList, Search, ChevronDown, ChevronUp,
  Calendar, Users, MapPin, Banknote, Clock, CheckCircle,
  XCircle, AlertCircle, MailCheck, Eye, X,
  MessageCircle, Send, Loader2, Store, UserCheck,
  IndianRupee, FileText, ArrowRight,
} from 'lucide-react';
import { customRequestsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:        { label: 'Pending',         color: 'bg-amber-100 text-amber-700',   icon: Clock },
  reviewing:      { label: 'Reviewing',       color: 'bg-blue-100 text-blue-700',     icon: AlertCircle },
  open:           { label: 'Open to Agents',  color: 'bg-indigo-100 text-indigo-700', icon: Store },
  agent_assigned: { label: 'Agent Assigned',  color: 'bg-purple-100 text-purple-700', icon: UserCheck },
  quoted:         { label: 'Quoted',          color: 'bg-orange-100 text-orange-700', icon: MailCheck },
  accepted:       { label: 'Accepted',        color: 'bg-teal-100 text-teal-700',    icon: CheckCircle },
  booked:         { label: 'Booked',          color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  rejected:       { label: 'Rejected',        color: 'bg-red-100 text-red-700',      icon: XCircle },
};

const STATUS_OPTIONS = [
  { value: '',              label: 'All Statuses' },
  { value: 'pending',       label: 'Pending' },
  { value: 'reviewing',     label: 'Reviewing' },
  { value: 'open',          label: 'Open to Agents' },
  { value: 'agent_assigned',label: 'Agent Assigned' },
  { value: 'quoted',        label: 'Quoted' },
  { value: 'accepted',      label: 'Accepted' },
  { value: 'booked',        label: 'Booked' },
  { value: 'rejected',      label: 'Rejected' },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
      <Icon className="w-3 h-3" />{meta.label}
    </span>
  );
}

// ─── Chat thread ─────────────────────────────────────────────────────────────
function ChatThread({ requestId }) {
  const [messages, setMessages]     = useState([]);
  const [loadingMsgs, setLoading]   = useState(true);
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const bottomRef = useRef(null);

  function load(silent = false) {
    if (!silent) setLoading(true);
    customRequestsAPI.getMessages(requestId)
      .then((r) => setMessages(r.data.data?.messages || []))
      .finally(() => { if (!silent) setLoading(false); });
  }

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 3000);
    return () => clearInterval(iv);
  }, [requestId]);

  useEffect(() => {
    if (bottomRef.current)
      bottomRef.current.parentElement.scrollTop = bottomRef.current.parentElement.scrollHeight;
  }, [messages]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try { await customRequestsAPI.addMessage(requestId, text.trim()); setText(''); load(); }
    finally { setSending(false); }
  }

  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Customer Conversation
        </p>
      </div>
      <div className="p-3 space-y-2 max-h-44 overflow-y-auto bg-white">
        {loadingMsgs && <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>}
        {!loadingMsgs && messages.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">No messages yet.</p>
        )}
        {messages.map((msg) => {
          const isAdmin = msg.senderRole === 'admin';
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${isAdmin ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                <p className="leading-snug">{msg.message}</p>
                <p className={`text-xs mt-0.5 ${isAdmin ? 'text-teal-200' : 'text-slate-400'}`}>
                  {isAdmin ? 'You' : 'Customer'} · {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-2 border-t border-slate-200 bg-slate-50">
        <input
          type="text" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Reply to customer…"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button onClick={send} disabled={!text.trim() || sending}
          className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 transition-colors">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Quote panel (shown when agent is assigned) ───────────────────────────────
function QuotePanel({ req, onSaved }) {
  const addToast  = useToast();
  const [price, setPrice]         = useState(req.quotedPrice || '');
  const [itinerary, setItinerary] = useState(req.itinerary || '');
  const [note, setNote]           = useState(req.adminNote || '');
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  async function handleSend() {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setErr('Enter a valid price'); return; }
    if (!itinerary.trim()) { setErr('Itinerary is required'); return; }
    setSaving(true); setErr('');
    try {
      await customRequestsAPI.sendQuote(req.id, {
        quotedPrice: parseFloat(price),
        itinerary:   itinerary.trim(),
        adminNote:   note.trim() || undefined,
      });
      addToast('Quote sent to customer!', 'success');
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send quote');
    } finally {
      setSaving(false);
    }
  }

  if (req.status === 'quoted') {
    return (
      <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
          <MailCheck className="w-4 h-4" /> Quote Sent — Awaiting Customer Response
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-orange-600 mb-0.5">Quoted Price</p>
            <p className="font-bold text-orange-900">₹{Number(req.quotedPrice).toLocaleString('en-IN')}</p>
          </div>
        </div>
        {req.itinerary && (
          <div>
            <p className="text-xs text-orange-600 mb-1">Itinerary sent</p>
            <p className="text-xs text-orange-800 whitespace-pre-wrap line-clamp-4">{req.itinerary}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
        <FileText className="w-4 h-4" /> Send Quote to Customer
      </p>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Quoted Price (₹) *</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 45000"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Itinerary / Day-by-day Plan *</label>
        <textarea rows={5} value={itinerary} onChange={(e) => setItinerary(e.target.value)}
          placeholder={`Day 1: Arrival at ${req.destination}, hotel check-in...\nDay 2: ...\nInclusions: ...\nExclusions: ...`}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Note (optional)</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Any extra info for the customer..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button onClick={handleSend} disabled={saving}
        className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {saving ? 'Sending…' : 'Send Quote to Customer'}
      </button>
    </div>
  );
}

// ─── Action panel per status ──────────────────────────────────────────────────
function ActionPanel({ req, onRefresh }) {
  const addToast = useToast();
  const [busy, setBusy] = useState(false);

  async function act(fn, successMsg) {
    setBusy(true);
    try { await fn(); addToast(successMsg, 'success'); onRefresh(); }
    catch (e) { addToast(e.response?.data?.message || 'Action failed', 'error'); }
    finally { setBusy(false); }
  }

  const assignedAgent = req.bookings?.[0]?.assignedAgent;

  return (
    <div className="mt-4 space-y-3">
      {/* Workflow steps */}
      {req.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> New Request — Review &amp; Chat
          </p>
          <p className="text-xs text-amber-700 mb-3">Chat with the customer to understand requirements, then mark as Reviewing.</p>
          <button onClick={() => act(() => customRequestsAPI.setReviewing(req.id), 'Marked as reviewing')}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Mark as Reviewing
          </button>
        </div>
      )}

      {req.status === 'reviewing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Store className="w-4 h-4" /> Ready to Post to Agent Marketplace?
          </p>
          <p className="text-xs text-blue-700 mb-3">
            This will make the booking visible to all agents. The first agent to apply will be auto-assigned.
            Only post once you've confirmed the destination and dates with the customer.
          </p>
          <button onClick={() => act(() => customRequestsAPI.postToMarketplace(req.id), 'Posted to agent marketplace!')}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Store className="w-3.5 h-3.5" />}
            Post to Agent Marketplace
          </button>
        </div>
      )}

      {req.status === 'open' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Waiting for an Agent to Apply…
          </p>
          <p className="text-xs text-indigo-700 mt-1">
            The first agent to apply will be auto-assigned. You'll be notified when this happens.
          </p>
        </div>
      )}

      {req.status === 'agent_assigned' && (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Agent Assigned
            </p>
            {assignedAgent && (
              <p className="text-xs text-purple-700 mt-1">
                {assignedAgent.user?.name || 'Agent'} has been assigned to this trip.
              </p>
            )}
          </div>
          <QuotePanel req={req} onSaved={onRefresh} />
        </div>
      )}

      {['quoted', 'accepted', 'booked'].includes(req.status) && (
        <div className="space-y-3">
          {assignedAgent && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span className="text-purple-800 font-medium">Agent: {assignedAgent.user?.name}</span>
            </div>
          )}
          <QuotePanel req={req} onSaved={onRefresh} />
          {req.status === 'accepted' && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-800">
              <CheckCircle className="w-4 h-4 inline mr-1.5 text-teal-600" />
              Customer accepted the quote — waiting for payment.
            </div>
          )}
          {req.status === 'booked' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
              <CheckCircle className="w-4 h-4 inline mr-1.5 text-green-600" />
              Payment received — booking confirmed!
            </div>
          )}
        </div>
      )}

      {req.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
          <XCircle className="w-4 h-4 inline mr-1.5 text-red-600" />
          Customer declined the quote.
          {req.customerNote && <span className="block mt-1 text-xs italic">"{req.customerNote}"</span>}
        </div>
      )}
    </div>
  );
}

// ─── Single row ───────────────────────────────────────────────────────────────
function RequestRow({ req, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const interests = Array.isArray(req.interests) ? req.interests : [];

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3">
          <p className="text-xs font-mono text-slate-500">{req.requestNumber}</p>
          <p className="text-sm font-semibold text-slate-900">{req.name}</p>
          <p className="text-xs text-slate-500">{req.email}</p>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />{req.destination}
          </div>
          {req.departureDate && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {req.departureDate}
            </p>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Users className="w-3.5 h-3.5" /> {req.adults}A{req.children > 0 ? ` ${req.children}C` : ''}
          </div>
          {req.budget && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> {req.budget}
            </p>
          )}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={req.status} />
          {req.quotedPrice && (
            <p className="text-xs font-semibold text-teal-600 mt-1 flex items-center gap-0.5">
              <IndianRupee className="w-3 h-3" />{Number(req.quotedPrice).toLocaleString('en-IN')}
            </p>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
          {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        <td className="px-4 py-3">
          <button onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="View details">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={6} className="px-6 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
              {req.tripType   && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Trip Type</p><p className="text-slate-800 capitalize">{req.tripType.replace(/_/g, ' ')}</p></div>}
              {req.duration   && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Duration</p><p className="text-slate-800">{req.duration} nights</p></div>}
              {req.accommodation && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Stay</p><p className="text-slate-800 capitalize">{req.accommodation.replace(/_/g, ' ')}</p></div>}
              {req.mealPlan   && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Meals</p><p className="text-slate-800 capitalize">{req.mealPlan.replace(/_/g, ' ')}</p></div>}
              {req.transport  && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Transport</p><p className="text-slate-800 capitalize">{req.transport.replace(/_/g, ' ')}</p></div>}
              {req.phone      && <div><p className="text-xs font-medium text-slate-500 mb-0.5">Phone</p><p className="text-slate-800">{req.phone}</p></div>}
            </div>

            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {interests.map((i) => (
                  <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs capitalize">{i.replace(/_/g, ' ')}</span>
                ))}
              </div>
            )}

            {req.specialRequests && (
              <div className="mb-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Special Requests</p>
                <p className="text-sm text-slate-700 bg-white rounded-lg px-3 py-2">{req.specialRequests}</p>
              </div>
            )}

            <ChatThread requestId={req.id} />
            <ActionPanel req={req} onRefresh={onRefresh} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AdminCustomRequests() {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const PER_PAGE = 20;

  function load() {
    setLoading(true);
    customRequestsAPI.getAll({ status: statusFilter || undefined, page, limit: PER_PAGE })
      .then((r) => { setRequests(r.data.data?.requests || []); setTotal(r.data.data?.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter, page]);

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) ||
           r.destination?.toLowerCase().includes(q) || r.requestNumber?.toLowerCase().includes(q);
  });

  const countsByStatus = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Custom Package Requests</h1>
          <p className="text-sm text-slate-500">{total} total requests</p>
        </div>
      </div>

      {/* Workflow legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Workflow</p>
        <div className="flex flex-wrap items-center gap-1 text-xs text-slate-600">
          {['pending','reviewing','open','agent_assigned','quoted','accepted','booked'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1">
              <StatusBadge status={s} />
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
            </span>
          ))}
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <button key={key}
              onClick={() => { setStatusFilter(statusFilter === key ? '' : key); setPage(1); }}
              className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                statusFilter === key ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-300'
              }`}>
              <Icon className={`w-4 h-4 mb-1 ${statusFilter === key ? 'text-teal-600' : 'text-slate-400'}`} />
              <p className="text-xs text-slate-500">{meta.label}</p>
              <p className="text-lg font-bold text-slate-900">{countsByStatus[key] || 0}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search name, email, destination…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <ClipboardList className="w-8 h-8" />
            <p className="text-sm">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Customer','Destination','Pax / Budget','Status','Date','Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <RequestRow key={req.id} req={req} onRefresh={load} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > PER_PAGE && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">Page {page} of {Math.ceil(total / PER_PAGE)}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / PER_PAGE)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

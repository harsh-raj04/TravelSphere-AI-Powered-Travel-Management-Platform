import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  RefreshCw,
  AlertTriangle,
  IndianRupee,
  Building2,
  Smartphone,
  CreditCard,
  User,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

// ─── Formatters ────────────────────────────────────────────────────────────────
const formatINR = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  pending:    { label: 'Pending',    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',   dot: 'bg-yellow-400' },
  processing: { label: 'Processing', cls: 'bg-blue-100 text-blue-700 border-blue-200',         dot: 'bg-blue-400'   },
  completed:  { label: 'Completed',  cls: 'bg-green-100 text-green-700 border-green-200',      dot: 'bg-green-500'  },
  failed:     { label: 'Failed',     cls: 'bg-red-100 text-red-700 border-red-200',            dot: 'bg-red-500'    },
};

function StatusChip({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Method icon ──────────────────────────────────────────────────────────────
function MethodIcon({ type }) {
  if (type === 'bank_account') return <Building2 className="w-4 h-4" />;
  if (type === 'upi') return <Smartphone className="w-4 h-4" />;
  return <CreditCard className="w-4 h-4" />;
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  const colors = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    red:    'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

// ─── Approve confirm modal ─────────────────────────────────────────────────────
function ApproveModal({ withdrawal, onClose, onConfirm, loading }) {
  if (!withdrawal) return null;
  const snap = withdrawal.methodSnapshot || {};
  return (
    <Modal isOpen={!!withdrawal} title="Approve Withdrawal" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          Approving will move this request to <strong>Processing</strong>. Ensure the bank transfer is initiated promptly.
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <Row label="Agent" value={withdrawal.agent?.user?.name || '—'} />
          <Row label="Amount" value={<span className="font-bold text-gray-900">{formatINR(withdrawal.amount)}</span>} />
          <Row label="Transfer To" value={`${snap.label || '—'} · ${snap.detail || ''}`} />
          <Row label="Transaction ID" value={<span className="font-mono text-xs">{withdrawal.transactionId}</span>} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Approve
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Complete modal ────────────────────────────────────────────────────────────
function CompleteModal({ withdrawal, onClose, onConfirm, loading }) {
  const [reference, setReference] = useState('');
  if (!withdrawal) return null;
  return (
    <Modal isOpen={!!withdrawal} title="Mark as Completed" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
          Confirm that <strong>{formatINR(withdrawal.amount)}</strong> has been transferred to the agent's account.
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            Bank / Transfer Reference <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="UTR / NEFT / IMPS reference number"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(reference)} disabled={loading} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <CheckCircle2 className="w-4 h-4" /> Mark Complete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Fail modal ────────────────────────────────────────────────────────────────
function FailModal({ withdrawal, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  if (!withdrawal) return null;
  return (
    <Modal isOpen={!!withdrawal} title="Mark as Failed" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            Marking as failed will release <strong>{formatINR(withdrawal.amount)}</strong> back to the agent's available balance.
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Invalid bank account details, transaction rejected by bank…"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading || !reason.trim()} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <XCircle className="w-4 h-4" /> Mark Failed
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}

// ─── Status tabs ───────────────────────────────────────────────────────────────
const TABS = ['all', 'pending', 'processing', 'completed', 'failed'];

// ─── AdminWithdrawals ──────────────────────────────────────────────────────────
export function AdminWithdrawals() {
  const addToast = useToast();

  const [withdrawals, setWithdrawals] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 });
  const [counts, setCounts] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  // ── Modal targets ────────────────────────────────────────────────────────────
  const [approveTarget, setApproveTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [failTarget, setFailTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab !== 'all') params.status = tab;
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.getWithdrawals(params);
      setWithdrawals(res.data?.data?.withdrawals || []);
      setSummary(res.data?.data?.summary || {});
      setCounts(res.data?.data?.counts || {});
    } catch {
      addToast('Failed to load withdrawals', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab, search, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await adminAPI.approveWithdrawal(approveTarget.id);
      addToast('Withdrawal approved — status moved to Processing', 'success');
      setApproveTarget(null);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (reference) => {
    setActionLoading(true);
    try {
      await adminAPI.completeWithdrawal(completeTarget.id, reference);
      addToast('Withdrawal marked as completed', 'success');
      setCompleteTarget(null);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to complete', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFail = async (reason) => {
    setActionLoading(true);
    try {
      await adminAPI.failWithdrawal(failTarget.id, reason);
      addToast('Withdrawal marked as failed', 'info');
      setFailTarget(null);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
            <ArrowDownLeft className="w-8 h-8 text-teal-600" />
            Agent Withdrawals
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Review and process agent payout requests</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending"
          value={formatINR(summary.pending)}
          sub={`${counts.pending || 0} request${counts.pending !== 1 ? 's' : ''}`}
          color="yellow"
        />
        <StatCard
          label="Processing"
          value={formatINR(summary.processing)}
          sub={`${counts.processing || 0} in progress`}
          color="blue"
        />
        <StatCard
          label="Completed"
          value={formatINR(summary.completed)}
          sub={`${counts.completed || 0} paid out`}
          color="green"
        />
        <StatCard
          label="Failed"
          value={formatINR(summary.failed)}
          sub={`${counts.failed || 0} rejected`}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agent or transaction ID…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                tab === t
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t}
              {t !== 'all' && counts[t] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  t === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                  t === 'processing' ? 'bg-blue-200 text-blue-800' :
                  t === 'completed' ? 'bg-green-200 text-green-800' :
                  'bg-red-200 text-red-800'
                }`}>{counts[t]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading withdrawals…</span>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <IndianRupee className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-600 dark:text-gray-300">No withdrawals found</p>
            <p className="text-sm text-gray-400 mt-1">
              {tab !== 'all' ? `No ${tab} withdrawals` : 'No withdrawal requests yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected By</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {withdrawals.map((w) => {
                  const snap = w.methodSnapshot || {};
                  const agentName = w.agent?.user?.name || '—';
                  const agencyName = w.agent?.agencyName || '';
                  return (
                    <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      {/* Agent */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{agentName}</p>
                            {agencyName && <p className="text-xs text-gray-500">{agencyName}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Txn ID */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{w.transactionId}</span>
                      </td>

                      {/* Method */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            <MethodIcon type={snap.type} />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{snap.label || '—'}</p>
                            <p className="text-xs text-gray-500">{snap.detail || ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right">
                        <span className="text-base font-bold text-gray-900 dark:text-white">{formatINR(w.amount)}</span>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {fmtDate(w.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {fmtDate(w.expectedAt)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <StatusChip status={w.status} />
                        {w.status === 'failed' && w.failureReason && (
                          <p className="text-[10px] text-red-500 mt-1 max-w-[120px] truncate mx-auto" title={w.failureReason}>
                            {w.failureReason}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {w.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setApproveTarget(w)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setFailTarget(w)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {w.status === 'processing' && (
                            <>
                              <button
                                onClick={() => setCompleteTarget(w)}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                              </button>
                              <button
                                onClick={() => setFailTarget(w)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Fail
                              </button>
                            </>
                          )}
                          {(w.status === 'completed' || w.status === 'failed') && (
                            <span className="text-xs text-gray-400 italic">
                              {w.processedAt ? fmtDate(w.processedAt) : '—'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Showing {withdrawals.length} withdrawal{withdrawals.length !== 1 ? 's' : ''}
        {tab !== 'all' ? ` · ${tab}` : ''}
      </p>

      {/* Modals */}
      <ApproveModal
        withdrawal={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        loading={actionLoading}
      />
      <CompleteModal
        withdrawal={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleComplete}
        loading={actionLoading}
      />
      <FailModal
        withdrawal={failTarget}
        onClose={() => setFailTarget(null)}
        onConfirm={handleFail}
        loading={actionLoading}
      />
    </div>
  );
}

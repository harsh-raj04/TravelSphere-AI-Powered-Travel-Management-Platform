import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, AlertCircle, CheckCircle2, Download, XCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { PageSpinner } from '../../components/ui/LoadingSpinner';

export function AdminTransactions() {
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = statusFilter === 'all' ? {} : { status: statusFilter };
        const res = await adminAPI.transactions(params);
        if (!cancelled) setPayments(res.data?.data?.items || []);
      } catch (err) {
        if (!cancelled) {
          console.error('[AdminPayments] Fetch failed:', err);
          setError(err.message || 'Failed to load');
          setPayments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchPayments();
    return () => { cancelled = true; };
  }, [statusFilter]);

  const filteredPayments = payments;

  const totalAmount = useMemo(
    () => payments.reduce((sum, p) => sum + (String(p.status).toLowerCase() === 'success' ? Number(p.amount || 0) : 0), 0),
    [payments]
  );
  const refundedAmount = useMemo(
    () => payments.reduce((sum, p) => sum + (String(p.status).toLowerCase() === 'refunded' ? Number(p.amount || 0) : 0), 0),
    [payments]
  );
  const failedCount = payments.filter((p) => String(p.status).toLowerCase() === 'failed').length;
  const completedCount = payments.filter((p) => String(p.status).toLowerCase() === 'success').length;

  const handleDownloadCSV = () => {
    const headers = ['Transaction ID', 'Booking ID', 'Customer', 'Amount', 'Status', 'Method', 'Date'];
    const rows = filteredPayments.map((p) => [
      p.id,
      p.bookingId || '',
      p.booking?.customer?.name || p.booking?.customer?.email || '',
      Number(p.amount || 0).toFixed(2),
      p.status || '',
      p.paymentMethod || 'razorpay',
      p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN') : '',
    ]);
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Payments & Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor all payment transactions</p>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
          Failed to load transactions: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-emerald-500/10 rounded-lg"><IndianRupee className="w-6 h-6 text-emerald-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Total Received</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString('en-IN')}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-blue-500/10 rounded-lg"><AlertCircle className="w-6 h-6 text-blue-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Refunded</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{refundedAmount.toLocaleString('en-IN')}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-red-500/10 rounded-lg"><XCircle className="w-6 h-6 text-red-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Failed Transactions</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{failedCount}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-blue-500/10 rounded-lg"><CheckCircle2 className="w-6 h-6 text-blue-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Completed</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{completedCount}</p></div></div></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by status:</label>
          <div className="flex gap-2">
            {['all', 'success', 'failed', 'refunded'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
      <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{payment.id.slice(0, 8)}…</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm text-blue-500">{payment.bookingId ? payment.bookingId.slice(0, 8) + '…' : '—'}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="font-medium text-gray-900 dark:text-white">{payment.booking?.customer?.name || payment.booking?.customer?.email || '—'}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-lg font-semibold text-gray-900 dark:text-white">₹{Number(payment.amount || 0).toLocaleString('en-IN')}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-xs text-gray-500">{payment.transactionReference?.slice(0, 12) || '—'}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={String(payment.status).toLowerCase()} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No payments found for this filter</p>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredPayments.length} transactions</div>
      </>
      )}
    </div>
  );
}

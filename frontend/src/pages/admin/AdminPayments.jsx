import { useState } from 'react';
import { CreditCard, IndianRupee, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { mockPayments } from './mockData';
import { StatusBadge } from '../../components/admin/StatusBadge';

export function AdminPayments() {
  const [payments] = useState(mockPayments);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayments = payments.filter((payment) => statusFilter === 'all' || payment.status === statusFilter);

  const totalAmount = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);
  const pendingAmount = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const failedCount = payments.filter((p) => p.status === 'failed').length;
  const completedCount = payments.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Payments & Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor all payment transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"><Download className="w-4 h-4" />Export Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-emerald-500/10 rounded-lg"><IndianRupee className="w-6 h-6 text-emerald-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Total Received</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString('en-IN')}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-amber-500/10 rounded-lg"><AlertCircle className="w-6 h-6 text-amber-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Pending</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{pendingAmount.toLocaleString('en-IN')}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-red-500/10 rounded-lg"><CreditCard className="w-6 h-6 text-red-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Failed Transactions</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{failedCount}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-blue-500/10 rounded-lg"><CheckCircle2 className="w-6 h-6 text-blue-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Completed</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{completedCount}</p></div></div></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by status:</label>
          <div className="flex gap-2">{['all', 'completed', 'pending', 'failed', 'refunded'].map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === status ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>{status}</button>)}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"><tr><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Transaction ID</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Booking ID</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Customer</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amount</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Method</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{filteredPayments.map((payment) => <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"><td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{payment.id}</span></td><td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm text-blue-500 hover:text-blue-600 cursor-pointer">{payment.bookingId}</span></td><td className="px-6 py-4 whitespace-nowrap"><span className="font-medium text-gray-900 dark:text-white">{payment.customerName}</span></td><td className="px-6 py-4 whitespace-nowrap"><span className="text-lg font-semibold text-gray-900 dark:text-white">₹{payment.amount.toLocaleString('en-IN')}</span></td><td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-600 dark:text-gray-400">{payment.method}</span></div></td><td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={payment.status} /></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{payment.date}</td><td className="px-6 py-4 whitespace-nowrap"><button className="text-blue-500 hover:text-blue-600 font-medium text-sm">View Details</button></td></tr>)}</tbody></table></div>
        {filteredPayments.length === 0 && <div className="text-center py-12"><p className="text-gray-500 dark:text-gray-400">No payments found for this filter</p></div>}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredPayments.length} of {payments.length} transactions</div>
    </div>
  );
}

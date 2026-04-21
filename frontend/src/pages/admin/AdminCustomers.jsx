import { useEffect, useMemo, useState } from 'react';
import { UserCircle, TrendingUp, IndianRupee, Calendar } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { StatusBadge } from '../../components/admin/StatusBadge';

export function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.customers();
        setCustomers(res.data?.data?.items || []);
      } catch {
        setCustomers([]);
      }
    })();
  }, []);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [customers, searchQuery]
  );

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
  const avgSpent = totalRevenue / Math.max(totalCustomers, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Customer Management</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage customer accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-blue-500/10 rounded-lg"><UserCircle className="w-6 h-6 text-blue-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalCustomers}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-6 h-6 text-emerald-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Active Customers</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{activeCustomers}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-purple-500/10 rounded-lg"><IndianRupee className="w-6 h-6 text-purple-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString('en-IN')}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-amber-500/10 rounded-lg"><Calendar className="w-6 h-6 text-amber-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Avg. Spent</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{avgSpent.toFixed(0)}</p></div></div></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total Bookings</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center"><span className="text-white font-semibold text-sm">{customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span></div><div><p className="font-medium text-gray-900 dark:text-white">{customer.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">ID: {customer.id}</p></div></div></td>
                  <td className="px-6 py-4"><div className="text-sm"><p className="text-gray-900 dark:text-white">{customer.email}</p><p className="text-gray-500 dark:text-gray-400">{customer.phone || '-'}</p></div></td>
                  <td className="px-6 py-4 text-center"><span className="inline-flex items-center justify-center min-w-[2rem] h-8 bg-blue-500/10 text-blue-500 rounded-full px-3 font-semibold">{customer.total_bookings}</span></td>
                  <td className="px-6 py-4"><span className="font-semibold text-gray-900 dark:text-white">₹{Number(customer.total_spent || 0).toLocaleString('en-IN')}</span></td>
                  <td className="px-6 py-4"><StatusBadge status={customer.status} variant="small" /></td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(customer.joined_date).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No customers found matching your search</p>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredCustomers.length} of {customers.length} customers</div>
    </div>
  );
}

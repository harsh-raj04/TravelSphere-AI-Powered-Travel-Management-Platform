import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { adminAPI, agentAPI } from '../../services/api';

const PAGE_SIZE = 50;

export function AdminBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const params = useMemo(() => {
    const next = { page: 1, limit: PAGE_SIZE };
    if (searchQuery.trim()) next.search = searchQuery.trim();
    if (statusFilter !== 'all') next.booking_status = statusFilter;
    return next;
  }, [searchQuery, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.bookings(params);
      setBookings(res.data?.data?.items || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [params]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await agentAPI.updateBookingStatus(bookingId, newStatus);
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, status: newStatus } : booking)));
    } catch {
      // Keep UI stable if API update fails.
    }
  };

  const filteredCount = bookings.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Bookings Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and assign bookings to agents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by customer, package, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {(statusFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')} className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">
                Status: {statusFilter}
                <X className="w-3 h-3" />
              </button>
            )}
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">
                Search: {searchQuery}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Package</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Assigned Agent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">Loading bookings...</td>
                </tr>
              )}

              {!loading && filteredCount === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No bookings found matching your filters</td>
                </tr>
              )}

              {!loading &&
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{booking.id}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div><p className="font-medium text-gray-900 dark:text-white">{booking.customer?.name || booking.customer?.email}</p><p className="text-sm text-gray-500 dark:text-gray-400">{booking.travelersCount} travelers</p></div></td>
                    <td className="px-6 py-4"><div><p className="font-medium text-gray-900 dark:text-white">{booking.package?.title}</p><p className="text-sm text-gray-500 dark:text-gray-400">{booking.package?.destination}</p></div></td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{booking.package?.agent?.user?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><select value={booking.status} onChange={(e) => handleStatusChange(booking.id, e.target.value)} className="px-3 py-1.5 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{new Date(booking.bookingDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="font-semibold text-gray-900 dark:text-white">₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredCount} bookings</div>
    </div>
  );
}

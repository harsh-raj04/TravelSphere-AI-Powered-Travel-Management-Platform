import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { mockBookings, mockAgents } from './mockData';

export function AdminBookings() {
  const [bookings, setBookings] = useState(mockBookings);
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || booking.agentId === agentFilter;
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesAgent && matchesSearch;
  });

  const handleAssignAgent = (bookingId, agentId) => {
    setBookings((prev) =>
      prev.map((booking) => {
        if (booking.id === bookingId) {
          const agent = mockAgents.find((a) => a.id === agentId);
          return {
            ...booking,
            agentId,
            agentName: agent?.name || null,
          };
        }
        return booking;
      })
    );
  };

  const handleStatusChange = (bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((booking) => (booking.id === bookingId ? { ...booking, status: newStatus } : booking))
    );
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agent</label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Agents</option>
              {mockAgents.filter((a) => a.status === 'active').map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>

        {(statusFilter !== 'all' || agentFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')} className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">
                Status: {statusFilter}
                <X className="w-3 h-3" />
              </button>
            )}
            {agentFilter !== 'all' && (
              <button onClick={() => setAgentFilter('all')} className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">
                Agent
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{booking.id}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div><p className="font-medium text-gray-900 dark:text-white">{booking.customerName}</p><p className="text-sm text-gray-500 dark:text-gray-400">{booking.travelers} travelers</p></div></td>
                  <td className="px-6 py-4"><div><p className="font-medium text-gray-900 dark:text-white">{booking.packageName}</p><p className="text-sm text-gray-500 dark:text-gray-400">{booking.destination}</p></div></td>
                  <td className="px-6 py-4"><select value={booking.agentId || ''} onChange={(e) => handleAssignAgent(booking.id, e.target.value)} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Unassigned</option>{mockAgents.filter((a) => a.status === 'active').map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></td>
                  <td className="px-6 py-4 whitespace-nowrap"><select value={booking.status} onChange={(e) => handleStatusChange(booking.id, e.target.value)} className="px-3 py-1.5 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{booking.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="font-semibold text-gray-900 dark:text-white">₹{booking.amount.toLocaleString('en-IN')}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><button className="text-blue-500 hover:text-blue-600 font-medium text-sm">View Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBookings.length === 0 && <div className="text-center py-12"><p className="text-gray-500 dark:text-gray-400">No bookings found matching your filters</p></div>}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredBookings.length} of {bookings.length} bookings</div>
    </div>
  );
}

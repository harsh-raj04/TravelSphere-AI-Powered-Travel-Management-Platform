import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { adminAPI, bookingsAPI } from '../../services/api';

const PAGE_SIZE = 50;

const canAssign = (status) => String(status || '').toLowerCase() === 'confirmed';

export function AdminBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [assignForm, setAssignForm] = useState({ agent_id: '', agent_payout: '' });
  const [assignError, setAssignError] = useState('');

  const params = useMemo(() => {
    const next = { page: 1, limit: PAGE_SIZE };
    if (searchQuery.trim()) next.search = searchQuery.trim();
    if (statusFilter !== 'all') next.booking_status = statusFilter;
    return next;
  }, [searchQuery, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, agentsRes] = await Promise.all([
        adminAPI.bookings(params),
        adminAPI.agents(),
      ]);

      setBookings(bookingsRes.data?.data?.items || []);
      setAgents(agentsRes.data?.data?.items || []);
    } catch {
      setBookings([]);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params]);

  const handleConfirmBooking = async (bookingId) => {
    try {
      const res = await adminAPI.confirmBooking(bookingId);
      const updated = res.data?.data;
      if (!updated) return;

      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, ...updated } : booking)));
    } catch {
      // ignore transient error; data will be refreshed on next filter change
    }
  };

  const handleCloseTrip = async (bookingId) => {
    try {
      await bookingsAPI.updateStatus(bookingId, { status: 'closed' });
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, status: 'closed' } : booking)));
    } catch {
      // keep UI stable on transient failure
    }
  };

  const openAssignModal = (booking) => {
    setAssigningBooking(booking);
    setAssignForm({
      agent_id: agents[0]?.id || '',
      agent_payout: booking?.agentPayout ? String(booking.agentPayout) : '',
    });
    setAssignError('');
  };

  const closeAssignModal = () => {
    setAssigningBooking(null);
    setAssignError('');
  };

  const submitAssignAgent = async (event) => {
    event.preventDefault();
    if (!assigningBooking) return;

    const payout = Number(assignForm.agent_payout);
    if (!assignForm.agent_id || !Number.isFinite(payout) || payout <= 0) {
      setAssignError('Please select agent and enter a valid payout.');
      return;
    }

    try {
      const res = await adminAPI.assignAgent(assigningBooking.id, {
        agent_id: assignForm.agent_id,
        agent_payout: payout,
      });
      const updated = res.data?.data;

      if (updated) {
        setBookings((prev) => prev.map((booking) => (booking.id === assigningBooking.id ? { ...booking, ...updated } : booking)));
      }

      closeAssignModal();
    } catch (err) {
      setAssignError(err?.response?.data?.message || 'Failed to assign agent.');
    }
  };

  const filteredCount = bookings.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Bookings Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Confirm requests, assign agents, and track margins</p>
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
              placeholder="Search by customer, package, or booking ID..."
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
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Booking</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Package</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Travel Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Financials</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading bookings...</td>
                </tr>
              )}

              {!loading && filteredCount === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No bookings found matching your filters</td>
                </tr>
              )}

              {!loading &&
                bookings.map((booking) => {
                  const amount = Number(booking.totalAmount || 0);
                  const payout = Number(booking.agentPayout || 0);
                  const margin = Number(booking.adminMargin || 0);

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-mono text-xs text-gray-700 dark:text-gray-300">{booking.id}</p>
                        <p className="text-xs mt-1 text-gray-500 capitalize">{booking.status}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{booking.customerName || booking.customer?.name || booking.customer?.email}</p>
                        <p className="text-xs text-gray-500">{booking.contactEmail || booking.customer?.email}</p>
                        <p className="text-xs text-gray-500">{booking.contactPhone || 'No phone'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{booking.package?.title}</p>
                        <p className="text-xs text-gray-500">{booking.package?.destination || 'Destination flexible'}</p>
                        <p className="text-xs text-gray-500">Agent: {booking.assignedAgent?.user?.name || 'Unassigned'}</p>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(booking.travelDate).toLocaleDateString('en-IN')}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <p className="text-gray-900 dark:text-white font-semibold">Price: ₹{amount.toLocaleString('en-IN')}</p>
                        <p className="text-gray-600 dark:text-gray-400">Payout: ₹{payout.toLocaleString('en-IN')}</p>
                        <p className="text-emerald-600 dark:text-emerald-400">Margin: ₹{margin.toLocaleString('en-IN')}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {String(booking.status).toLowerCase() === 'pending' && (
                            <button
                              onClick={() => handleConfirmBooking(booking.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Confirm
                            </button>
                          )}

                          {canAssign(booking.status) && (
                            <button
                              onClick={() => openAssignModal(booking)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Assign Agent
                            </button>
                          )}

                          {String(booking.status).toLowerCase() === 'completed' && (
                            <button
                              onClick={() => handleCloseTrip(booking.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700"
                            >
                              Finalize Trip
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredCount} bookings</div>

      {assigningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Agent</h3>
              <button onClick={closeAssignModal} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitAssignAgent} className="p-5 space-y-4">
              {assignError && <p className="text-sm text-red-600">{assignError}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent</label>
                <select
                  value={assignForm.agent_id}
                  onChange={(event) => setAssignForm((prev) => ({ ...prev, agent_id: event.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.name} ({agent.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent Payout</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={assignForm.agent_payout}
                  onChange={(event) => setAssignForm((prev) => ({ ...prev, agent_payout: event.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="e.g. 12000"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeAssignModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

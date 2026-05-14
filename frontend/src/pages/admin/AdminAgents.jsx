import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Star, User2, X, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { PageSpinner } from '../../components/ui/LoadingSpinner';

const PAGE_SIZE = 25;

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const payoutStatusClass = (status) => {
  if (status === 'paid') return 'bg-emerald-50 text-emerald-700';
  if (status === 'partial') return 'bg-yellow-50 text-yellow-700';
  return 'bg-red-50 text-red-700';
};

export function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [payoutAmount, setPayoutAmount] = useState('0');
  const [payoutReference, setPayoutReference] = useState('');
  const [selectedBookingForPayout, setSelectedBookingForPayout] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [agentsRes, bookingsRes] = await Promise.all([
        adminAPI.agents(),
        adminAPI.bookings({ page: 1, limit: PAGE_SIZE }),
      ]);

      setAgents(agentsRes.data?.data?.items || []);
      setBookings(bookingsRes.data?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load agent data.');
      setAgents([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const agentMapByProfileId = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent])),
    [agents]
  );

  const agentStats = useMemo(() => {
    const stats = new Map();

    for (const booking of bookings) {
      const agentId = booking.assignedAgent?.id;
      if (!agentId) continue;

      if (!stats.has(agentId)) {
        stats.set(agentId, {
          completed: 0,
          ongoing: 0,
          complaints: 0,
          revenue: 0,
          due: 0,
          paid: 0,
          trips: [],
        });
      }

      const row = stats.get(agentId);
      row.trips.push(booking);
      row.revenue += Number(booking.agentPayout || 0);
      row.paid += Number(booking.payoutPaidAmount || 0);
      row.due += Math.max(0, Number(booking.agentPayout || 0) - Number(booking.payoutPaidAmount || 0));

      if (['completed', 'closed'].includes(booking.status)) row.completed += 1;
      if (['accepted', 'assigned', 'in_progress'].includes(booking.status)) row.ongoing += 1;
    }

    return stats;
  }, [bookings]);

  const enrichedAgents = useMemo(() => {
    return agents
      .map((agent) => {
        const s = agentStats.get(agent.id) || {
          completed: 0,
          ongoing: 0,
          complaints: 0,
          revenue: Number(agent.revenue || 0),
          due: 0,
          paid: 0,
          trips: [],
        };

        const rating = agent.agentRating || 0;

        return {
          ...agent,
          computedRating: Number(rating.toFixed(1)),
          completedTrips: s.completed,
          ongoingTrips: s.ongoing,
          complaints: agent.tripRejectedCount || 0,
          computedRevenue: Number(s.revenue.toFixed(2)),
          dueAmount: Number(s.due.toFixed(2)),
          paidAmount: Number(s.paid.toFixed(2)),
          trips: s.trips,
        };
      })
      .sort((a, b) => b.computedRating - a.computedRating || b.completedTrips - a.completedTrips);
  }, [agents, agentStats]);

  const totals = useMemo(() => {
    return {
      totalAgents: enrichedAgents.length,
      activeAgents: enrichedAgents.filter((a) => a.status === 'active').length,
      totalDue: enrichedAgents.reduce((sum, a) => sum + Number(a.dueAmount || 0), 0),
      totalPaid: enrichedAgents.reduce((sum, a) => sum + Number(a.paidAmount || 0), 0),
    };
  }, [enrichedAgents]);

  const [searchQuery, setSearchQuery] = useState('');
  const [agentPage, setAgentPage] = useState(1);

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return enrichedAgents;
    const q = searchQuery.trim().toLowerCase();
    return enrichedAgents.filter(
      (a) =>
        (a.user?.name || a.name || '').toLowerCase().includes(q) ||
        (a.user?.email || a.email || '').toLowerCase().includes(q)
    );
  }, [enrichedAgents, searchQuery]);

  const totalAgentPages = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));
  const pagedAgents = filteredAgents.slice((agentPage - 1) * PAGE_SIZE, agentPage * PAGE_SIZE);

  const openAgent = (agent) => {
    setSelectedAgent(agent);
    setActiveTab('profile');

    const firstDueTrip = (agent.trips || []).find((trip) => Number(trip.agentPayout || 0) > Number(trip.payoutPaidAmount || 0));
    setSelectedBookingForPayout(firstDueTrip?.id || '');
    setPayoutAmount('0');
    setPayoutReference('');
  };

  const selectedAgentTrips = selectedAgent?.trips || [];

  const payoutCandidates = useMemo(
    () => selectedAgentTrips.filter((trip) => Number(trip.agentPayout || 0) > 0),
    [selectedAgentTrips]
  );

  const selectedPayoutTrip = useMemo(
    () => payoutCandidates.find((trip) => trip.id === selectedBookingForPayout) || null,
    [payoutCandidates, selectedBookingForPayout]
  );

  const applyPayoutUpdate = async () => {
    if (!selectedPayoutTrip) {
      setError('Select a trip to update payout.');
      return;
    }

    const amount = Number(payoutAmount || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Payout amount must be zero or positive.');
      return;
    }

    if (!payoutReference.trim()) {
      setError('Transaction ID is required.');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      await adminAPI.updateBookingPayout(selectedPayoutTrip.id, {
        paid_amount: amount,
        payout_transaction_reference: payoutReference.trim(),
      });

      await loadData();

      if (selectedAgent) {
        const latest = agentMapByProfileId.get(selectedAgent.id);
        const merged = latest
          ? enrichedAgents.find((row) => row.id === latest.id)
          : enrichedAgents.find((row) => row.id === selectedAgent.id);
        if (merged) {
          setSelectedAgent(merged);
        }
      }

      setPayoutAmount('0');
      setPayoutReference('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update payout.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Agent Management</h1>
        <p className="text-gray-600">Metrics-first monitoring with profile, trip history, customer feedback, and payout management.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Total Agents</p><p className="text-2xl font-bold text-gray-900 mt-1">{totals.totalAgents}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Active Agents</p><p className="text-2xl font-bold text-emerald-600 mt-1">{totals.activeAgents}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Total Paid</p><p className="text-2xl font-bold text-emerald-700 mt-1">{formatINR(totals.totalPaid)}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Total Due</p><p className="text-2xl font-bold text-amber-700 mt-1">{formatINR(totals.totalDue)}</p></div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setAgentPage(1); }}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trips Completed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trips Ongoing</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Issues/Complaints</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedAgents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {searchQuery ? `No agents match "${searchQuery}"` : 'No agents registered yet'}
                      </p>
                      {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); setAgentPage(1); }} className="mt-2 text-sm text-blue-600 hover:underline">
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                )}
                {pagedAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-sm text-gray-500">{agent.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900"><Star className="w-4 h-4 text-amber-500" /> {agent.computedRating}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{agent.completedTrips}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{agent.ongoingTrips}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{agent.complaints}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-amber-700">{formatINR(agent.dueAmount)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openAgent(agent)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalAgentPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(agentPage - 1) * PAGE_SIZE + 1}–{Math.min(agentPage * PAGE_SIZE, filteredAgents.length)} of {filteredAgents.length} agents
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAgentPage((p) => Math.max(1, p - 1))}
                  disabled={agentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700 px-2">Page {agentPage} of {totalAgentPages}</span>
                <button
                  onClick={() => setAgentPage((p) => Math.min(totalAgentPages, p + 1))}
                  disabled={agentPage === totalAgentPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-6xl rounded-xl bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedAgent.name}</h3>
                <p className="text-sm text-gray-600">Complete profile, trip history, and payout operations</p>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>

            <div className="px-5 pt-4">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
                <button onClick={() => setActiveTab('profile')} className={`px-3 py-1.5 rounded-md ${activeTab === 'profile' ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-600'}`}>Profile</button>
                <button onClick={() => setActiveTab('trips')} className={`px-3 py-1.5 rounded-md ${activeTab === 'trips' ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-600'}`}>Trips History</button>
                <button onClick={() => setActiveTab('payments')} className={`px-3 py-1.5 rounded-md ${activeTab === 'payments' ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-600'}`}>Payments</button>
              </div>
            </div>

            <div className="p-5 max-h-[72vh] overflow-auto">
              {activeTab === 'profile' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Signup Profile Data</p>
                    <p className="text-sm text-gray-700"><span className="font-semibold">Name:</span> {selectedAgent.name}</p>
                    <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {selectedAgent.email}</p>
                    <p className="text-sm text-gray-700"><span className="font-semibold">Phone:</span> {selectedAgent.phone || 'Not provided'}</p>
                    <p className="text-sm text-gray-700"><span className="font-semibold">Agency:</span> {selectedAgent.agency_name || 'Independent'}</p>
                    <p className="text-sm text-gray-700"><span className="font-semibold">Status:</span> {selectedAgent.status}</p>
                    <p className="text-sm text-gray-700"><span className="font-semibold">Joined:</span> {new Date(selectedAgent.joined_date).toLocaleDateString('en-IN')}</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Performance Snapshot</p>
                    <p className="text-sm text-gray-700">Rating: <span className="font-semibold">{selectedAgent.computedRating}</span></p>
                    <p className="text-sm text-gray-700">Trips Completed: <span className="font-semibold">{selectedAgent.completedTrips}</span></p>
                    <p className="text-sm text-gray-700">Trips Ongoing: <span className="font-semibold">{selectedAgent.ongoingTrips}</span></p>
                    <p className="text-sm text-gray-700">Issues/Complaints: <span className="font-semibold">{selectedAgent.complaints}</span></p>
                    <p className="text-sm text-gray-700">Total Revenue: <span className="font-semibold">{formatINR(selectedAgent.computedRevenue)}</span></p>
                  </div>
                </div>
              )}

              {activeTab === 'trips' && (
                <div className="space-y-3">
                  {selectedAgentTrips.length === 0 && <p className="text-sm text-gray-500">No trip history yet.</p>}
                  {selectedAgentTrips.map((trip) => (
                    <div key={trip.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{trip.package?.title}</p>
                          <p className="text-sm text-gray-600">Date: {new Date(trip.travelDate).toLocaleDateString('en-IN')}</p>
                          <p className="text-sm text-gray-600">Customer: {trip.customerName || trip.customer?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 capitalize">{trip.status}</p>
                        </div>
                      </div>
                      {trip.feedbackComment && <p className="text-sm text-gray-700 mt-2">Remark: {trip.feedbackComment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Earned</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(selectedAgent.computedRevenue)}</p></div>
                    <div className="rounded-lg border border-gray-200 p-4"><p className="text-xs text-gray-500">Paid</p><p className="text-2xl font-bold text-emerald-700 mt-1">{formatINR(selectedAgent.paidAmount)}</p></div>
                    <div className="rounded-lg border border-gray-200 p-4"><p className="text-xs text-gray-500">Due</p><p className="text-2xl font-bold text-amber-700 mt-1">{formatINR(selectedAgent.dueAmount)}</p></div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Update Payout</p>
                    <div className="grid md:grid-cols-3 gap-3">
                      <select
                        value={selectedBookingForPayout}
                        onChange={(event) => setSelectedBookingForPayout(event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Select trip</option>
                        {payoutCandidates.map((trip) => (
                          <option key={trip.id} value={trip.id}>{trip.package?.title} - {new Date(trip.travelDate).toLocaleDateString('en-IN')}</option>
                        ))}
                      </select>

                      <input
                        value={payoutAmount}
                        onChange={(event) => setPayoutAmount(event.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Amount to pay"
                      />

                      <input
                        value={payoutReference}
                        onChange={(event) => setPayoutReference(event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Transaction ID provided by admin"
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={applyPayoutUpdate}
                        disabled={updating}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                      >
                        Update Payout
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[860px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trip</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payout</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paid</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Txn ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {payoutCandidates.map((trip) => {
                            const payout = Number(trip.agentPayout || 0);
                            const paid = Number(trip.payoutPaidAmount || 0);
                            const due = Math.max(0, payout - paid);
                            const payoutStatus = trip.payoutStatus || (paid >= payout ? 'paid' : paid > 0 ? 'partial' : 'unpaid');

                            return (
                              <tr key={trip.id}>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-gray-900">{trip.package?.title}</p>
                                  <p className="text-xs text-gray-500">{new Date(trip.travelDate).toLocaleDateString('en-IN')}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{formatINR(payout)}</td>
                                <td className="px-4 py-3 text-sm text-emerald-700">{formatINR(paid)}</td>
                                <td className="px-4 py-3 text-sm text-amber-700">{formatINR(due)}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${payoutStatusClass(payoutStatus)}`}>{payoutStatus}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{trip.payoutTransactionReference || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

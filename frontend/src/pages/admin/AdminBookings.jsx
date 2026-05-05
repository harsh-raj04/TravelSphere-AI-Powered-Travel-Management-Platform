import { useEffect, useMemo, useState } from 'react';
import { Calendar, IndianRupee, MapPin, Search, Star, Users, X } from 'lucide-react';
import { adminAPI, bookingsAPI } from '../../services/api';

const PAGE_SIZE = 80;

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const reputationClass = (score) => {
  if (score >= 85) return 'border-emerald-400 bg-emerald-50';
  if (score >= 65) return 'border-yellow-400 bg-yellow-50';
  return 'border-red-300 bg-red-50';
};

const reputationTextClass = (score) => {
  if (score >= 85) return 'text-emerald-700';
  if (score >= 65) return 'text-yellow-700';
  return 'text-red-700';
};

const scoreAgent = (agent) => {
  const ratingPart = Math.min(50, Number(agent.rating || 0) * 10);
  const completedPart = Math.min(25, Number(agent.completedTrips || 0));
  const ongoingPenalty = Math.min(15, Number(agent.activeTrips || 0) * 3);
  const complaintPenalty = Math.min(20, Number(agent.complaints || 0) * 4);
  return Math.max(0, Math.round(ratingPart + completedPart - ongoingPenalty - complaintPenalty));
};

function PaymentBreakdown({ booking }) {
  const payout = booking.financials?.payout || booking.agentPayout;
  const commission = booking.financials?.commission || 0;
  const gst = booking.financials?.gst || 0;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs uppercase tracking-wide text-emerald-700 mb-2">Payment Breakdown</p>
      <p className="text-3xl font-bold text-emerald-700 mb-2">{formatINR(payout)}</p>
      <div className="space-y-1 text-sm text-gray-700">
        <p>Total Booking: <span className="font-semibold">{formatINR(booking.totalAmount || booking.financials?.total)}</span></p>
        <p>Commission Cut: <span className="font-semibold text-amber-700">-{formatINR(commission)}</span></p>
        <p>GST Cut: <span className="font-semibold text-amber-700">-{formatINR(gst)}</span></p>
        <p>Payout Status: <span className="font-semibold capitalize">{booking.payoutStatus || 'unpaid'}</span></p>
      </div>
    </div>
  );
}

export function AdminBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [activeTab, setActiveTab] = useState('booking_info');

  const [appModalBooking, setAppModalBooking] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutRef, setPayoutRef] = useState('');
  const [busyActionId, setBusyActionId] = useState('');

  const params = useMemo(() => {
    const next = { page: 1, limit: PAGE_SIZE };
    if (query.trim()) next.search = query.trim();
    if (statusFilter !== 'all') next.booking_status = statusFilter;
    return next;
  }, [query, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await adminAPI.bookings(params);
      const items = res.data?.data?.items || [];
      setBookings(items);

      if (!selectedBookingId && items.length > 0) {
        setSelectedBookingId(items[0].id);
      }

      if (selectedBookingId && !items.find((item) => item.id === selectedBookingId)) {
        setSelectedBookingId(items[0]?.id || '');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bookings.');
      setBookings([]);
      setSelectedBookingId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [params]);

  const selectedBooking = useMemo(
    () => bookings.find((item) => item.id === selectedBookingId) || null,
    [bookings, selectedBookingId]
  );

  useEffect(() => {
    if (selectedBooking) {
      setPayoutAmount(String(Number(selectedBooking.payoutPaidAmount || 0)));
      setPayoutRef(selectedBooking.payoutTransactionReference || '');
    }
  }, [selectedBooking?.id]);

  const confirmBooking = async (id) => {
    try {
      setBusyActionId(id);
      await adminAPI.confirmBooking(id);
      await fetchBookings();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to confirm booking.');
    } finally {
      setBusyActionId('');
    }
  };

  const publishBooking = async (id) => {
    try {
      setBusyActionId(id);
      await adminAPI.publishBooking(id);
      await fetchBookings();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to publish booking.');
    } finally {
      setBusyActionId('');
    }
  };

  const closeBooking = async (id) => {
    try {
      setBusyActionId(id);
      await bookingsAPI.updateStatus(id, { status: 'closed' });
      await fetchBookings();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to close booking.');
    } finally {
      setBusyActionId('');
    }
  };

  const openApplications = async (booking) => {
    setAppModalBooking(booking);
    setApplicationsLoading(true);
    setError('');

    try {
      const res = await adminAPI.bookingApplications(booking.id);
      const items = (res.data?.data?.items || []).map((item) => ({
        ...item,
        agentProfile: {
          ...item.agentProfile,
          complaints: Number(item.agentProfile?.pendingRequests || 0),
        },
      }));
      setApplications(items);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load applicants.');
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const assignApplicant = async (bookingId, applicationId) => {
    try {
      setBusyActionId(applicationId);
      await adminAPI.selectBookingApplication(bookingId, applicationId);
      await fetchBookings();
      setAppModalBooking(null);
      setApplications([]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to assign agent.');
    } finally {
      setBusyActionId('');
    }
  };

  const updatePayout = async (bookingId) => {
    const paidAmount = Number(payoutAmount || 0);

    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      setError('Payout amount must be zero or positive.');
      return;
    }

    if (!payoutRef.trim()) {
      setError('Please provide payout transaction reference.');
      return;
    }

    try {
      setBusyActionId(bookingId);
      await adminAPI.updateBookingPayout(bookingId, {
        paid_amount: paidAmount,
        payout_transaction_reference: payoutRef.trim(),
      });
      await fetchBookings();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update payout.');
    } finally {
      setBusyActionId('');
    }
  };

  const rankedApplications = useMemo(() => {
    return [...applications]
      .map((item) => ({ ...item, score: scoreAgent(item.agentProfile || {}) }))
      .sort((a, b) => b.score - a.score || (b.agentProfile?.rating || 0) - (a.agentProfile?.rating || 0));
  }, [applications]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Bookings</h1>
        <p className="text-gray-600">Horizontal booking list with full manage page, assignment matrix, and payout updates.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, package, destination"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="open_for_agents">Open for Agents</option>
          <option value="assigned">Assigned</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <section className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-600">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">No bookings found.</div>
        ) : (
          bookings.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 bg-white flex flex-wrap items-center justify-between gap-3 ${selectedBookingId === item.id ? 'border-blue-500 shadow-sm' : 'border-gray-200'}`}
            >
              <div className="min-w-[260px]">
                <p className="text-xs text-gray-500 font-mono">{item.id}</p>
                <p className="text-base font-semibold text-gray-900">{item.package?.title}</p>
                <p className="text-sm text-gray-600">{item.customerName || item.customer?.name}</p>
              </div>

              <div className="text-sm text-gray-700">
                <p className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(item.travelDate).toLocaleDateString('en-IN')}</p>
                <p className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {item.package?.destination || 'Destination flexible'}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                <p className="text-sm font-semibold capitalize text-gray-900">{item.status}</p>
              </div>

              <button
                onClick={() => setSelectedBookingId(item.id)}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                Manage
              </button>
            </div>
          ))
        )}
      </section>

      {selectedBooking && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Manage Booking</h2>
              <p className="text-sm text-gray-600">{selectedBooking.package?.title} • {selectedBooking.id}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedBooking.status === 'pending' && (
                <button
                  onClick={() => confirmBooking(selectedBooking.id)}
                  disabled={busyActionId === selectedBooking.id}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                >
                  Confirm
                </button>
              )}
              {selectedBooking.status === 'confirmed' && (
                <button
                  onClick={() => publishBooking(selectedBooking.id)}
                  disabled={busyActionId === selectedBooking.id}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm"
                >
                  Open to Agents
                </button>
              )}
              {selectedBooking.status === 'open_for_agents' && (
                <button
                  onClick={() => openApplications(selectedBooking)}
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                >
                  Assign to Agent
                </button>
              )}
              {selectedBooking.status === 'completed' && (
                <button
                  onClick={() => closeBooking(selectedBooking.id)}
                  disabled={busyActionId === selectedBooking.id}
                  className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm"
                >
                  Finalize Close
                </button>
              )}
            </div>
          </div>

          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
            <button
              onClick={() => setActiveTab('booking_info')}
              className={`px-3 py-1.5 rounded-md ${activeTab === 'booking_info' ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-600'}`}
            >
              Booking Info
            </button>
            <button
              onClick={() => setActiveTab('package_policy')}
              className={`px-3 py-1.5 rounded-md ${activeTab === 'package_policy' ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-600'}`}
            >
              Package Policy
            </button>
          </div>

          {activeTab === 'booking_info' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Customer Booking Details</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.customerName || selectedBooking.customer?.name}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.contactEmail || selectedBooking.customer?.email}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.contactPhone || 'No phone provided'}</p>
                  <p className="text-sm text-gray-600 mt-2">Travelers: {selectedBooking.travelersCount}</p>
                  <p className="text-sm text-gray-600">Travel date: {new Date(selectedBooking.travelDate).toLocaleDateString('en-IN')}</p>
                </div>

                <PaymentBreakdown booking={selectedBooking} />
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Admin Action Panel</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Payout Paid Amount</label>
                    <input
                      value={payoutAmount}
                      onChange={(event) => setPayoutAmount(event.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500">Payout Transaction ID (admin reference)</label>
                    <input
                      value={payoutRef}
                      onChange={(event) => setPayoutRef(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. UTR12345 / BANKREF999"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => updatePayout(selectedBooking.id)}
                    disabled={busyActionId === selectedBooking.id}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                  >
                    Update Agent Payout
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'package_policy' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Package Details</p>
                <p className="text-sm text-gray-700">{selectedBooking.package?.description || 'No package description available.'}</p>
                <p className="text-sm text-gray-700 mt-2">Destination: {selectedBooking.package?.destination || 'Flexible'}</p>
                <p className="text-sm text-gray-700">Duration: {selectedBooking.package?.durationDays || 0} days</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Itinerary</p>
                {(selectedBooking.package?.itinerary || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No itinerary available.</p>
                ) : (
                  <ul className="space-y-1 text-sm text-gray-700">
                    {(selectedBooking.package?.itinerary || []).map((line, index) => (
                      <li key={index}>Day {index + 1}: {line}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Inclusion / Exclusion</p>
                  <p className="text-sm text-gray-700">Defined by package description and itinerary points shared with customer and assigned agent.</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Terms & Conditions</p>
                  <p className="text-sm text-gray-700">Refund and cancellation policies are applicable to both customer and agent workflow.</p>
                  <p className="text-sm text-gray-700 mt-1">Disputes, no-show, and cancellation conditions follow platform policy.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {appModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-white border border-gray-200 shadow-xl max-h-[88vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Select Agent • {appModalBooking.package?.title}</h3>
              <button onClick={() => { setAppModalBooking(null); setApplications([]); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-auto max-h-[74vh] space-y-3">
              {applicationsLoading ? (
                <p className="text-sm text-gray-600">Loading willing agents...</p>
              ) : rankedApplications.length === 0 ? (
                <p className="text-sm text-gray-500">No willing agent found for this trip yet.</p>
              ) : (
                rankedApplications.map((application) => {
                  const profile = application.agentProfile || {};
                  const score = application.score;

                  return (
                    <div key={application.id} className={`rounded-lg border p-4 ${reputationClass(score)}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{profile.name}</p>
                          <p className="text-sm text-gray-600">{profile.email}</p>
                        </div>
                        <div className={`text-sm font-semibold ${reputationTextClass(score)}`}>
                          Reputation Score: {score}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-3 text-sm mb-3">
                        <p><span className="font-semibold">Rating:</span> {profile.rating || 0} <Star className="w-3 h-3 inline" /></p>
                        <p><span className="font-semibold">Trip completed:</span> {profile.completedTrips || 0}</p>
                        <p><span className="font-semibold">Trip ongoing:</span> {profile.activeTrips || 0}</p>
                        <p><span className="font-semibold">Complaints/issues:</span> {profile.complaints || 0}</p>
                      </div>

                      {application.message && (
                        <p className="text-sm text-gray-700 mb-3">"{application.message}"</p>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => assignApplicant(appModalBooking.id, application.id)}
                          disabled={busyActionId === application.id}
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                        >
                          Assign This Agent
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

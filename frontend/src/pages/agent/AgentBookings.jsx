import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { agentAPI } from '../../services/api';
import { Calendar, CheckCircle2, Clock, IndianRupee, MapPin, Package, Search, User2, XCircle } from 'lucide-react';

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const AVAILABILITY = {
  BUSY: 'busy',
  AVAILABLE: 'available',
  MAYBE: 'maybe',
};

function EarningBox({ financials }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
      <p className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold mb-1">Payout After Deductions</p>
      <p className="text-3xl font-bold text-emerald-700 mb-2">{formatINR(financials?.agent_payout)}</p>
      <div className="text-xs text-gray-700 space-y-1">
        <p>Total Booking Value: <span className="font-semibold text-gray-900">{formatINR(financials?.total)}</span></p>
        <p>Commission Cut: <span className="font-semibold text-amber-700">-{formatINR(financials?.platform_commission)}</span></p>
        <p>GST Cut: <span className="font-semibold text-amber-700">-{formatINR(financials?.gst)}</span></p>
      </div>
    </div>
  );
}

function parsePolicy(packageData) {
  const description = String(packageData?.description || '');
  return {
    refund: description.includes('refund') ? 'Refund terms are mentioned in package notes.' : 'Refund allowed only as per admin-approved policy.',
    cancellation: description.includes('cancel') ? 'Cancellation terms are included in package notes.' : 'Cancellation before departure may attract charges.',
    terms: 'All travelers and assigned agents are subject to TravelSphere terms and dispute policy.',
  };
}

export function AgentBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [assignedItems, setAssignedItems] = useState([]);
  const [myApplications, setMyApplications] = useState([]);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [applyMessage, setApplyMessage] = useState('');

  const [availability, setAvailability] = useState({});
  const [busyReason, setBusyReason] = useState({});

  const [updatingId, setUpdatingId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');

    try {
      const [marketRes, assignedRes, applicationsRes] = await Promise.all([
        agentAPI.marketplace(),
        agentAPI.bookings(),
        agentAPI.myApplications(),
      ]);

      setMarketplaceItems(marketRes.data?.data?.items || []);
      setAssignedItems(assignedRes.data?.data?.items || []);
      setMyApplications(applicationsRes.data?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load booking packages.');
      setMarketplaceItems([]);
      setAssignedItems([]);
      setMyApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const appliedBookingIds = useMemo(
    () => new Set((myApplications || []).map((item) => item.bookingId || item.booking?.id)),
    [myApplications]
  );

  const visiblePackages = useMemo(() => {
    const term = query.trim().toLowerCase();
    return marketplaceItems.filter((item) => {
      if (!term) return true;
      const title = String(item.package?.title || '').toLowerCase();
      const destination = String(item.package?.destination || '').toLowerCase();
      return title.includes(term) || destination.includes(term);
    });
  }, [query, marketplaceItems]);

  const openDetails = async (id) => {
    setApplyMessage('');
    setActiveDetailTab('overview');
    setError('');

    try {
      const res = await agentAPI.marketplaceDetails(id);
      setSelectedBooking(res.data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load booking details.');
    }
  };

  const applyForTrip = async (bookingId, message = '') => {
    try {
      setUpdatingId(bookingId);
      await agentAPI.applyForTrip(bookingId, { message: message.trim() || undefined });
      await loadAll();
      setSelectedBooking(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to opt for this trip.');
    } finally {
      setUpdatingId('');
    }
  };

  const setAvailabilityState = async (bookingId) => {
    const state = availability[bookingId];

    if (!state) {
      setError('Select one availability option first.');
      return;
    }

    if (state === AVAILABILITY.AVAILABLE) {
      await applyForTrip(bookingId, 'I am available and willing to take this trip.');
      return;
    }

    if (state === AVAILABILITY.MAYBE) {
      await applyForTrip(bookingId, 'Tentatively available. Please consider and allow final confirmation.');
      return;
    }

    if (state === AVAILABILITY.BUSY) {
      setError('Marked as busy. You can apply later if you become available.');
    }
  };

  const updateAssignedStatus = async (bookingId, status, remark) => {
    try {
      setUpdatingId(bookingId);
      await agentAPI.updateBookingStatus(bookingId, {
        status,
        decision_remark: remark || undefined,
        rejection_reason: status === 'rejected' ? (remark || 'Busy or unavailable') : undefined,
      });
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Packages</h1>
        <p className="text-gray-600">Browse all open packages like customer view, inspect full details, and choose your availability.</p>
      </div>

      <Card variant="elevated" className="p-4 bg-white border border-gray-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search package title or destination"
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900"
          />
        </div>
      </Card>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Open Packages ({visiblePackages.length})</h2>

          {loading ? (
            <p className="text-sm text-gray-600">Loading packages...</p>
          ) : visiblePackages.length === 0 ? (
            <Card variant="elevated" className="p-8 text-center bg-white border border-gray-200 text-gray-600">No package found for the selected filter.</Card>
          ) : (
            visiblePackages.map((item) => {
              const alreadyApplied = item.hasApplied || appliedBookingIds.has(item.id);
              const state = availability[item.id] || '';

              return (
                <Card key={item.id} variant="elevated" className="p-5 bg-white border border-gray-200">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 inline-flex items-center gap-2">
                        <Package className="w-4 h-4" /> {item.package?.title || 'Package'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 inline-flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> {item.package?.destination || 'Destination flexible'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {new Date(item.travelDate).toLocaleDateString()} • {item.package?.durationDays || 0} days
                      </p>
                    </div>
                    <Badge variant="warning">Open for Agents</Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">{item.package?.description || 'No description available.'}</p>

                  <EarningBox financials={item.financials} />

                  <div className="grid md:grid-cols-3 gap-2 mt-4">
                    <button
                      onClick={() => setAvailability((prev) => ({ ...prev, [item.id]: AVAILABILITY.BUSY }))}
                      className={`rounded-lg border px-3 py-2 text-sm ${state === AVAILABILITY.BUSY ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      I am busy now
                    </button>
                    <button
                      onClick={() => setAvailability((prev) => ({ ...prev, [item.id]: AVAILABILITY.AVAILABLE }))}
                      className={`rounded-lg border px-3 py-2 text-sm ${state === AVAILABILITY.AVAILABLE ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Available and willing
                    </button>
                    <button
                      onClick={() => setAvailability((prev) => ({ ...prev, [item.id]: AVAILABILITY.MAYBE }))}
                      className={`rounded-lg border px-3 py-2 text-sm ${state === AVAILABILITY.MAYBE ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Maybe / tentative
                    </button>
                  </div>

                  {state === AVAILABILITY.BUSY && (
                    <input
                      value={busyReason[item.id] || ''}
                      onChange={(event) => setBusyReason((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Optional note why you are busy"
                    />
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button size="sm" variant="secondary" onClick={() => openDetails(item.id)}>View Details</Button>
                    <Button
                      size="sm"
                      onClick={() => setAvailabilityState(item.id)}
                      disabled={alreadyApplied || updatingId === item.id}
                    >
                      {alreadyApplied ? 'Already Opted' : 'Opt To Complete'}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <Card variant="elevated" className="p-4 bg-white border border-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">My Active Assignments</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{assignedItems.length}</p>
          </Card>

          <Card variant="elevated" className="p-4 bg-white border border-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">My Applications</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{myApplications.length}</p>
          </Card>

          <Card variant="elevated" className="p-4 bg-white border border-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Assigned Trip Actions</p>
            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {assignedItems.length === 0 && <p className="text-sm text-gray-500">No assigned trips yet.</p>}
              {assignedItems.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{booking.package?.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{new Date(booking.travelDate).toLocaleDateString()} • {booking.status}</p>
                  <p className="text-xs text-emerald-700 mt-1">Payout: {formatINR(booking.agentPayout)}</p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {booking.status === 'assigned' && (
                      <>
                        <Button size="sm" onClick={() => updateAssignedStatus(booking.id, 'accepted', 'Accepted by agent')} disabled={updatingId === booking.id}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateAssignedStatus(booking.id, 'rejected', 'Agent currently busy')} disabled={updatingId === booking.id}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {booking.status === 'accepted' && (
                      <Button size="sm" onClick={() => updateAssignedStatus(booking.id, 'in_progress', 'Trip started')} disabled={updatingId === booking.id}>
                        <Clock className="w-4 h-4 mr-1" /> Start Trip
                      </Button>
                    )}
                    {booking.status === 'in_progress' && (
                      <Button size="sm" onClick={() => updateAssignedStatus(booking.id, 'completed', 'Trip completed by agent')} disabled={updatingId === booking.id}>
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white border border-gray-200 shadow-xl max-h-[88vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{selectedBooking.package?.title}</h3>
              <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">✕</button>
            </div>

            <div className="px-5 pt-4">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
                {['overview', 'itinerary', 'inclusions', 'exclusions', 'timing', 'terms', 'earnings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={`px-3 py-1.5 rounded-md capitalize ${activeDetailTab === tab ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-600'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-auto max-h-[72vh]">
              {activeDetailTab === 'overview' && (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>{selectedBooking.package?.description || 'No package overview available.'}</p>
                  <p><span className="font-semibold">Destination:</span> {selectedBooking.package?.destination || 'Flexible'}</p>
                  <p><span className="font-semibold">Travel Date:</span> {new Date(selectedBooking.travelDate).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Duration:</span> {selectedBooking.package?.durationDays || 0} days</p>
                </div>
              )}

              {activeDetailTab === 'itinerary' && (
                <ul className="space-y-2 text-sm text-gray-700">
                  {(selectedBooking.package?.itinerary || []).length === 0 && <li>No itinerary details added yet.</li>}
                  {(selectedBooking.package?.itinerary || []).map((row, index) => (
                    <li key={index}>Day {index + 1}: {row}</li>
                  ))}
                </ul>
              )}

              {activeDetailTab === 'inclusions' && (
                <div className="text-sm text-gray-700">
                  <p>Inclusions are provided in package description and itinerary for both customer and agent execution.</p>
                </div>
              )}

              {activeDetailTab === 'exclusions' && (
                <div className="text-sm text-gray-700">
                  <p>Exclusions should be reviewed in package notes before final assignment.</p>
                </div>
              )}

              {activeDetailTab === 'timing' && (
                <div className="text-sm text-gray-700">
                  <p>Departure timing and checkpoints are available after assignment acceptance.</p>
                </div>
              )}

              {activeDetailTab === 'terms' && (
                <div className="text-sm text-gray-700 space-y-2">
                  {(() => {
                    const policy = parsePolicy(selectedBooking.package);
                    return (
                      <>
                        <p><span className="font-semibold">Refund Policy:</span> {policy.refund}</p>
                        <p><span className="font-semibold">Cancellation Policy:</span> {policy.cancellation}</p>
                        <p><span className="font-semibold">Terms & Conditions:</span> {policy.terms}</p>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeDetailTab === 'earnings' && <EarningBox financials={selectedBooking.financials} />}

              <div>
                <label className="text-sm font-medium text-gray-700">Optional note while opting</label>
                <textarea
                  rows={3}
                  value={applyMessage}
                  onChange={(event) => setApplyMessage(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Mention why you are suitable for this destination"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setSelectedBooking(null)}>Close</Button>
                <Button
                  onClick={() => applyForTrip(selectedBooking.id, applyMessage)}
                  disabled={updatingId === selectedBooking.id || Boolean(selectedBooking.myApplication)}
                >
                  {selectedBooking.myApplication ? 'Already Opted' : 'Opt To Complete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

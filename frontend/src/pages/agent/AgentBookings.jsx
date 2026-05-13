import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { agentAPI } from '../../services/api';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  IndianRupee,
  MapPin,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  User2,
  XCircle,
} from 'lucide-react';

// ─── Formatters ────────────────────────────────────────────────────────────────

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVAILABILITY = {
  BUSY: 'busy',
  AVAILABLE: 'available',
  MAYBE: 'maybe',
};

// ─── EarningBox ────────────────────────────────────────────────────────────────

function EarningBox({ financials }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
      <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-2">
        Payout After Deductions
      </p>
      <p className="text-4xl font-bold text-emerald-700 mb-4">
        {formatINR(financials?.agent_payout)}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Total Booking Value</span>
          <span className="text-xs font-semibold text-gray-900">
            {formatINR(financials?.total)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Platform Commission</span>
          <span className="text-xs font-semibold text-amber-600">
            -{formatINR(financials?.platform_commission)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">GST Deduction</span>
          <span className="text-xs font-semibold text-amber-600">
            -{formatINR(financials?.gst)}
          </span>
        </div>
        <div className="h-px bg-emerald-200 my-1" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700">Your Payout</span>
          <span className="text-xs font-bold text-emerald-700">
            {formatINR(financials?.agent_payout)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── parsePolicy (unchanged) ───────────────────────────────────────────────────

function parsePolicy(packageData) {
  const description = String(packageData?.description || '');
  return {
    refund: description.includes('refund')
      ? 'Refund terms are mentioned in package notes.'
      : 'Refund allowed only as per admin-approved policy.',
    cancellation: description.includes('cancel')
      ? 'Cancellation terms are included in package notes.'
      : 'Cancellation before departure may attract charges.',
    terms:
      'All travelers and assigned agents are subject to TravelSphere terms and dispute policy.',
  };
}

// ─── SkeletonCard ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-20 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-16 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-9 bg-gray-200 rounded-lg" />
        <div className="h-9 bg-gray-200 rounded-lg" />
        <div className="h-9 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Assigned trip status helpers ─────────────────────────────────────────────

const STATUS_ACCENT = {
  assigned: 'border-l-blue-400',
  accepted: 'border-l-teal-400',
  in_progress: 'border-l-amber-400',
  completed: 'border-l-emerald-400',
  rejected: 'border-l-red-400',
};

const STATUS_BADGE = {
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  accepted: 'bg-teal-100 text-teal-700 border-teal-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

// ─── Main component ────────────────────────────────────────────────────────────

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

  // ─ New UI state ─
  const [activeFilter, setActiveFilter] = useState('all');

  // ─── Data loading ──────────────────────────────────────────────────────────

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

  // ─── Derived data ──────────────────────────────────────────────────────────

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

  const totalAgentPayout = useMemo(
    () => assignedItems.reduce((sum, b) => sum + Number(b.agentPayout || 0), 0),
    [assignedItems]
  );

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case 'open':
        return visiblePackages.filter(
          (item) => !item.hasApplied && !appliedBookingIds.has(item.id)
        );
      case 'applied':
        return visiblePackages.filter(
          (item) => item.hasApplied || appliedBookingIds.has(item.id)
        );
      case 'assigned':
        return [];
      default:
        return visiblePackages;
    }
  }, [activeFilter, visiblePackages, appliedBookingIds]);

  const openCount = useMemo(
    () =>
      marketplaceItems.filter(
        (item) => !item.hasApplied && !appliedBookingIds.has(item.id)
      ).length,
    [marketplaceItems, appliedBookingIds]
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

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
      await applyForTrip(
        bookingId,
        'Tentatively available. Please consider and allow final confirmation.'
      );
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
        rejection_reason:
          status === 'rejected' ? remark || 'Busy or unavailable' : undefined,
      });
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId('');
    }
  };

  // ─── Filter tab config ─────────────────────────────────────────────────────

  const filterTabs = [
    { key: 'all', label: 'All', count: visiblePackages.length + assignedItems.length },
    { key: 'open', label: 'Open', count: openCount },
    { key: 'applied', label: 'Applied', count: myApplications.length },
    { key: 'assigned', label: 'Assigned', count: assignedItems.length },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Marketplace</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Browse open packages, track applications, and manage your assignments
          </p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-600 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Open Packages */}
        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-4xl font-bold leading-none mb-1">{marketplaceItems.length}</p>
          <p className="text-sm text-white/80">Open Packages</p>
        </div>

        {/* My Applications */}
        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-4xl font-bold leading-none mb-1">{myApplications.length}</p>
          <p className="text-sm text-white/80">My Applications</p>
        </div>

        {/* Active Assignments */}
        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-4xl font-bold leading-none mb-1">{assignedItems.length}</p>
          <p className="text-sm text-white/80">Active Assignments</p>
        </div>

        {/* Total Payout */}
        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-4xl font-bold leading-none mb-1">
            {formatINR(totalAgentPayout)}
          </p>
          <p className="text-sm text-white/80">Total Payout</p>
        </div>
      </div>

      {/* ── Search + Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by package title or destination"
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activeFilter === tab.key
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Package Cards (left 2/3) ──────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : activeFilter === 'assigned' ? (
            /* Assigned view inside left column when filter=assigned */
            assignedItems.length === 0 ? (
              <EmptyState message="No assigned trips yet." />
            ) : (
              assignedItems.map((booking) => (
                <AssignedTripCard
                  key={booking.id}
                  booking={booking}
                  updatingId={updatingId}
                  onUpdateStatus={updateAssignedStatus}
                />
              ))
            )
          ) : filteredItems.length === 0 ? (
            <EmptyState />
          ) : (
            filteredItems.map((item) => {
              const alreadyApplied = item.hasApplied || appliedBookingIds.has(item.id);
              const state = availability[item.id] || '';

              return (
                <div
                  key={item.id}
                  className={`rounded-xl bg-white shadow-sm border border-gray-200 border-l-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden ${
                    alreadyApplied ? 'border-l-teal-400' : 'border-l-amber-400'
                  }`}
                >
                  <div className="p-5">
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 truncate">
                          <Package className="w-4 h-4 text-teal-500 flex-shrink-0" />
                          {item.package?.title || 'Package'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.package?.destination || 'Destination flexible'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(item.travelDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {item.package?.durationDays || 0} days
                          </span>
                        </div>
                      </div>
                      <span
                        className={`flex-shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          alreadyApplied
                            ? 'bg-teal-100 text-teal-700 border-teal-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        {alreadyApplied ? 'Applied' : 'Open'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {item.package?.description || 'No description available.'}
                    </p>

                    {/* Financial mini-cards */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-semibold mb-0.5">
                          Your Payout
                        </p>
                        <p className="text-xl font-bold text-emerald-700">
                          {formatINR(item.financials?.agent_payout)}
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-[10px] uppercase tracking-wide text-blue-600 font-semibold mb-0.5">
                          Booking Value
                        </p>
                        <p className="text-xl font-bold text-blue-700">
                          {formatINR(item.financials?.total)}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 mb-4" />

                    {/* Availability buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        onClick={() =>
                          setAvailability((prev) => ({
                            ...prev,
                            [item.id]: AVAILABILITY.BUSY,
                          }))
                        }
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                          state === AVAILABILITY.BUSY
                            ? 'border-red-400 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        I am busy now
                      </button>
                      <button
                        onClick={() =>
                          setAvailability((prev) => ({
                            ...prev,
                            [item.id]: AVAILABILITY.AVAILABLE,
                          }))
                        }
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                          state === AVAILABILITY.AVAILABLE
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        onClick={() =>
                          setAvailability((prev) => ({
                            ...prev,
                            [item.id]: AVAILABILITY.MAYBE,
                          }))
                        }
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                          state === AVAILABILITY.MAYBE
                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Maybe
                      </button>
                    </div>

                    {/* Busy reason input */}
                    {state === AVAILABILITY.BUSY && (
                      <input
                        value={busyReason[item.id] || ''}
                        onChange={(event) =>
                          setBusyReason((prev) => ({
                            ...prev,
                            [item.id]: event.target.value,
                          }))
                        }
                        className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                        placeholder="Optional note why you are busy"
                      />
                    )}

                    <div className="h-px bg-gray-100 mb-4" />

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => openDetails(item.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-200 text-teal-600 text-sm font-medium hover:bg-teal-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => setAvailabilityState(item.id)}
                        disabled={alreadyApplied || updatingId === item.id}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          alreadyApplied
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed'
                        }`}
                      >
                        {updatingId === item.id ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 animate-spin" />
                            Processing...
                          </span>
                        ) : alreadyApplied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Already Opted
                          </>
                        ) : (
                          <>
                            Opt To Complete
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right Panel — Assigned Trips ────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Assigned Trips
                <span className="ml-2 bg-teal-100 text-teal-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                  {assignedItems.length}
                </span>
              </h2>
              <Briefcase className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {assignedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Briefcase className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No assigned trips yet.</p>
                </div>
              ) : (
                assignedItems.map((booking) => (
                  <AssignedTripCard
                    key={booking.id}
                    booking={booking}
                    updatingId={updatingId}
                    onUpdateStatus={updateAssignedStatus}
                  />
                ))
              )}
            </div>
          </div>

          {/* Applications summary card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">My Applications</h2>
              <ClipboardList className="w-4 h-4 text-gray-400" />
            </div>
            {myApplications.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">You have not applied for any trips yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {myApplications.map((app) => {
                  const pkg = app.booking?.package || app.package;
                  const bookingDate = app.booking?.travelDate || app.travelDate;
                  return (
                    <div
                      key={app.id}
                      className="flex items-start justify-between gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {pkg?.title || 'Package'}
                        </p>
                        {bookingDate && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {new Date(bookingDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">
                        Pending
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedBooking.package?.title}
                </h3>
                {selectedBooking.package?.destination && (
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedBooking.package.destination}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['overview', 'itinerary', 'inclusions', 'exclusions', 'timing', 'terms', 'earnings'].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveDetailTab(tab)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                        activeDetailTab === tab
                          ? 'bg-teal-500 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeDetailTab === 'overview' && (
                <div className="space-y-4 text-sm text-gray-700">
                  <p className="leading-relaxed">
                    {selectedBooking.package?.description || 'No package overview available.'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
                        Destination
                      </p>
                      <p className="font-semibold text-gray-900">
                        {selectedBooking.package?.destination || 'Flexible'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
                        Travel Date
                      </p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedBooking.travelDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
                        Duration
                      </p>
                      <p className="font-semibold text-gray-900">
                        {selectedBooking.package?.durationDays || 0} days
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'itinerary' && (
                <div className="space-y-3">
                  {(selectedBooking.package?.itinerary || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No itinerary details added yet.</p>
                  ) : (
                    (selectedBooking.package?.itinerary || []).map((row, index) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-xl bg-gray-50 border border-gray-200 p-3"
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <p className="text-sm text-gray-700 self-center">{row}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeDetailTab === 'inclusions' && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
                  <p>
                    Inclusions are provided in package description and itinerary for both
                    customer and agent execution.
                  </p>
                </div>
              )}

              {activeDetailTab === 'exclusions' && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  <p>
                    Exclusions should be reviewed in package notes before final assignment.
                  </p>
                </div>
              )}

              {activeDetailTab === 'timing' && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                  <p>
                    Departure timing and checkpoints are available after assignment acceptance.
                  </p>
                </div>
              )}

              {activeDetailTab === 'terms' && (
                <div className="space-y-3">
                  {(() => {
                    const policy = parsePolicy(selectedBooking.package);
                    return [
                      { label: 'Refund Policy', value: policy.refund, color: 'blue' },
                      { label: 'Cancellation Policy', value: policy.cancellation, color: 'amber' },
                      { label: 'Terms & Conditions', value: policy.terms, color: 'gray' },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className={`rounded-xl bg-${color}-50 border border-${color}-200 p-4`}
                      >
                        <p className={`text-xs font-bold text-${color}-700 uppercase tracking-wide mb-1`}>
                          {label}
                        </p>
                        <p className={`text-sm text-${color}-800`}>{value}</p>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {activeDetailTab === 'earnings' && (
                <EarningBox financials={selectedBooking.financials} />
              )}

              {/* Optional note textarea */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Optional note while opting
                </label>
                <textarea
                  rows={3}
                  value={applyMessage}
                  onChange={(event) => setApplyMessage(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                  placeholder="Mention why you are suitable for this destination"
                />
              </div>

              {/* Modal action buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => applyForTrip(selectedBooking.id, applyMessage)}
                  disabled={
                    updatingId === selectedBooking.id ||
                    Boolean(selectedBooking.myApplication)
                  }
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    selectedBooking.myApplication
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed'
                  }`}
                >
                  {updatingId === selectedBooking.id ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : selectedBooking.myApplication ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Already Opted
                    </>
                  ) : (
                    <>
                      Opt To Complete
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AssignedTripCard ──────────────────────────────────────────────────────────

function AssignedTripCard({ booking, updatingId, onUpdateStatus }) {
  const accentClass = STATUS_ACCENT[booking.status] || 'border-l-gray-300';
  const badgeClass = STATUS_BADGE[booking.status] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div
      className={`rounded-xl border border-gray-200 border-l-4 bg-white p-4 ${accentClass}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
          {booking.package?.title || 'Trip'}
        </p>
        <span
          className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${badgeClass}`}
        >
          {booking.status?.replace('_', ' ') || 'Unknown'}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(booking.travelDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      <p className="text-sm font-bold text-emerald-600 mb-3">
        {formatINR(booking.agentPayout)}
        <span className="text-xs font-normal text-gray-400 ml-1">payout</span>
      </p>

      <div className="flex flex-wrap gap-1.5">
        {booking.status === 'assigned' && (
          <>
            <button
              onClick={() => onUpdateStatus(booking.id, 'accepted', 'Accepted by agent')}
              disabled={updatingId === booking.id}
              className="flex items-center gap-1 bg-teal-500 text-white hover:bg-teal-600 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Accept
            </button>
            <button
              onClick={() =>
                onUpdateStatus(booking.id, 'rejected', 'Agent currently busy')
              }
              disabled={updatingId === booking.id}
              className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </>
        )}
        {booking.status === 'accepted' && (
          <button
            onClick={() => onUpdateStatus(booking.id, 'in_progress', 'Trip started')}
            disabled={updatingId === booking.id}
            className="flex items-center gap-1 bg-amber-500 text-white hover:bg-amber-600 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Clock className="w-3.5 h-3.5" />
            Start Trip
          </button>
        )}
        {booking.status === 'in_progress' && (
          <button
            onClick={() =>
              onUpdateStatus(booking.id, 'completed', 'Trip completed by agent')
            }
            disabled={updatingId === booking.id}
            className="flex items-center gap-1 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Completed
          </button>
        )}
      </div>
    </div>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Package className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No packages found</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        {message || 'Try adjusting your search or check back later for new packages.'}
      </p>
    </div>
  );
}

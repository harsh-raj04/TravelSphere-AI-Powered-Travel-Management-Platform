import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { agentAPI, bookingsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import {
  Calendar, Users, MapPin, DollarSign, CheckCircle2, XCircle,
  Clock, AlertCircle, ThumbsUp, ThumbsDown, Sparkles, ArrowRight,
  TrendingUp, Package, RefreshCw, IndianRupee,
} from 'lucide-react';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const REJECT_REASONS = [
  'Schedule conflict',
  'Location issue too far',
  'Customer demands too high',
  'Not experienced for this route',
  'Personal emergency',
  'Other reason',
];

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  assigned:          { accent: 'border-l-blue-400',    badge: 'bg-blue-100 text-blue-700 border-blue-200',       label: 'PENDING ACTION' },
  in_progress:       { accent: 'border-l-amber-400',   badge: 'bg-amber-100 text-amber-700 border-amber-200',     label: 'IN PROGRESS' },
  accepted:          { accent: 'border-l-teal-400',    badge: 'bg-teal-100 text-teal-700 border-teal-200',        label: 'IN PROGRESS' },
  completed:         { accent: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'COMPLETED' },
  completed_by_agent:{ accent: 'border-l-yellow-400',  badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',  label: 'AWAITING ADMIN' },
  rejected:          { accent: 'border-l-red-400',     badge: 'bg-red-100 text-red-700 border-red-200',           label: 'REJECTED' },
  cancelled:         { accent: 'border-l-gray-300',    badge: 'bg-gray-100 text-gray-600 border-gray-200',        label: 'CANCELLED' },
};

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 border-l-4 border-l-gray-200 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-gray-200 rounded w-2/3" />
          <div className="flex gap-4">
            <div className="h-3.5 bg-gray-200 rounded w-24" />
            <div className="h-3.5 bg-gray-200 rounded w-20" />
            <div className="h-3.5 bg-gray-200 rounded w-16" />
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-16 bg-gray-200 rounded-xl" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 bg-gray-200 rounded-lg w-28" />
        <div className="h-9 bg-gray-200 rounded-lg w-28" />
      </div>
    </div>
  );
}

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({ booking, onAccept, onReject, onView }) {
  // Custom bookings in 'assigned' state = agent selected but customer hasn't paid yet
  const isAwaitingPayment = booking.status === 'assigned' && !!booking.customRequestId && !booking.confirmedAt;
  const canAccept  = booking.status === 'assigned' && !isAwaitingPayment;
  const isInProgress = booking.status === 'in_progress' || booking.status === 'accepted';
  const canComplete  = isInProgress;
  const isCancelled  = booking.status === 'cancelled';
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.cancelled;

  return (
    <div className={`rounded-xl bg-white border border-gray-200 border-l-4 ${cfg.accent} shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate mb-1.5">
              {booking.package?.title || (booking.customRequest ? `Custom — ${booking.customRequest.destination}` : 'Custom Package')}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {booking.package?.destination || booking.customRequest?.destination || 'Destination TBD'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {booking.travelersCount} travelers
              </span>
            </div>
          </div>
          <span className={`flex-shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Payout / Total row */}
        {isAwaitingPayment ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Awaiting customer payment</strong> — you've been assigned to this trip. The quote is being finalised. Payout details will appear once the customer pays.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Your Payout</p>
              <p className="text-xl font-bold text-purple-700">{formatINR(booking.agentPayout)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Total Package</p>
              <p className="text-xl font-bold text-blue-700">{formatINR(booking.totalAmount)}</p>
            </div>
          </div>
        )}

        {/* Inline actions row */}
        {!canAccept && !isAwaitingPayment && onView && (
          <div className="flex items-center justify-end gap-3 mt-3">
            {canComplete && (
              <button
                onClick={() => onView(booking, { action: 'complete' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Complete
              </button>
            )}
            <button
              onClick={() => onView(booking)}
              className="flex items-center gap-1.5 text-teal-600 hover:text-teal-800 text-sm font-semibold transition-colors"
            >
              View Details
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Accept / Decline — only for standard assigned bookings (custom awaits payment separately) */}
        {canAccept && !isAwaitingPayment && (
          <div className="flex gap-2.5 mt-3">
            <button
              onClick={() => onAccept(booking)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-sm hover:shadow transition-all"
            >
              <ThumbsUp className="w-4 h-4" />
              Accept Trip
            </button>
            <button
              onClick={() => onReject(booking)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-all"
            >
              <ThumbsDown className="w-4 h-4" />
              Decline
            </button>
          </div>
        )}

        {/* Info banners */}
        {isInProgress && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            Trip is in progress. Mark it completed after the service ends.
          </div>
        )}
        {isCancelled && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
            <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
            This booking was cancelled by admin.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, iconColor, title, count, badgeColor }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
        {count}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgentBookingsNew() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');
  const [processingBookingId, setProcessingBookingId] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await agentAPI.bookings();
      setBookings(res.data?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const groupedBookings = useMemo(() => {
    const assigned        = bookings.filter((b) => b.status === 'assigned');
    const inProgress      = bookings.filter((b) => ['in_progress', 'accepted'].includes(b.status));
    const agentCompleted  = bookings.filter((b) => b.status === 'completed_by_agent');
    const rejected        = bookings.filter((b) => b.status === 'rejected');
    const completed       = bookings.filter((b) => b.status === 'completed');
    const cancelled       = bookings.filter((b) => b.status === 'cancelled');
    return { assigned, inProgress, agentCompleted, rejected, completed, cancelled };
  }, [bookings]);

  const statsData = useMemo(() => ({
    assigned:      groupedBookings.assigned.length,
    inProgress:    groupedBookings.inProgress.length,
    rejected:      groupedBookings.rejected.length,
    totalEarnings: groupedBookings.completed.reduce((sum, b) => sum + Number(b.agentPayout || 0), 0),
  }), [groupedBookings]);

  const handleAcceptClick  = (booking) => { setSelectedBooking(booking); setShowAcceptModal(true); };
  const handleRejectClick  = (booking) => { setSelectedBooking(booking); setRejectReason(''); setRejectMessage(''); setShowRejectModal(true); };
  const handleViewClick    = (booking, opts) => {
    if (opts?.action === 'complete') { setSelectedBooking(booking); setShowCompleteModal(true); return; }
    navigate(`/agent/bookings/${booking.id}`, { state: { booking } });
  };

  const confirmAccept = async () => {
    try {
      setProcessingBookingId(selectedBooking.id);
      await bookingsAPI.updateStatus(selectedBooking.id, { status: 'in_progress', decision_remark: 'Accepted by agent and trip started' });
      await loadBookings();
      setShowAcceptModal(false);
      setSelectedBooking(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to accept booking');
    } finally {
      setProcessingBookingId('');
    }
  };

  const confirmReject = async () => {
    if (!rejectReason) { toast('Please select a reason for rejection', 'warning'); return; }
    try {
      setProcessingBookingId(selectedBooking.id);
      await bookingsAPI.updateStatus(selectedBooking.id, { status: 'rejected', rejection_reason: rejectReason, decision_remark: rejectMessage || undefined });
      await loadBookings();
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason('');
      setRejectMessage('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject booking');
    } finally {
      setProcessingBookingId('');
    }
  };

  const confirmComplete = async () => {
    if (!selectedBooking) return;
    try {
      setProcessingBookingId(selectedBooking.id);
      await bookingsAPI.updateStatus(selectedBooking.id, { status: 'completed', decision_remark: 'Marked completed by agent' });
      await loadBookings();
      setShowCompleteModal(false);
      setSelectedBooking(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to mark booking completed');
    } finally {
      setProcessingBookingId('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">

      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Bookings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage assigned trips, move them to in progress, and close them out.</p>
        </div>
        <button
          onClick={loadBookings}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Stat Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-4xl font-bold leading-none mb-1">{statsData.assigned}</p>
          <p className="text-sm text-white/80">Pending Action</p>
        </div>

        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-4xl font-bold leading-none mb-1">{statsData.inProgress}</p>
          <p className="text-sm text-white/80">In Progress</p>
        </div>

        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-red-500 to-orange-500 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-4xl font-bold leading-none mb-1">{statsData.rejected}</p>
          <p className="text-sm text-white/80">Rejected</p>
        </div>

        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-3xl font-bold leading-none mb-1">{formatINR(statsData.totalEarnings)}</p>
          <p className="text-sm text-white/80">Total Earnings</p>
        </div>
      </div>

      {/* ── Booking Lists ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : bookings.length === 0 ? (
        /* ── Empty State ── */
        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-8 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-4">
                <Sparkles className="w-4 h-4" />
                No assigned trips yet
              </div>
              <h3 className="text-3xl font-bold mb-3">You're ready for assignments.</h3>
              <p className="text-white/85 text-base leading-relaxed">
                Browse the package catalog, opt in on trips you can handle, and wait for admin to assign you a booking.
                Once assigned, this page will show accept and reject actions.
              </p>
            </div>
            <button
              onClick={() => navigate('/agent/packages')}
              className="flex items-center gap-2 px-5 py-3 bg-white text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-100 shadow transition-colors shrink-0"
            >
              Browse Packages
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Pending Action */}
          {groupedBookings.assigned.length > 0 && (
            <div>
              <SectionHeader icon={Clock} iconColor="bg-blue-100 text-blue-600" title="Pending Your Action" count={groupedBookings.assigned.length} badgeColor="bg-blue-100 text-blue-700" />
              <div className="space-y-4">
                {groupedBookings.assigned.map((b) => (
                  <BookingCard key={b.id} booking={b} onAccept={handleAcceptClick} onReject={handleRejectClick} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* In Progress */}
          {groupedBookings.inProgress.length > 0 && (
            <div>
              <SectionHeader icon={CheckCircle2} iconColor="bg-teal-100 text-teal-600" title="In Progress" count={groupedBookings.inProgress.length} badgeColor="bg-teal-100 text-teal-700" />
              <div className="space-y-4">
                {groupedBookings.inProgress.map((b) => (
                  <BookingCard key={b.id} booking={b} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* Awaiting Admin */}
          {groupedBookings.agentCompleted.length > 0 && (
            <div>
              <SectionHeader icon={Package} iconColor="bg-yellow-100 text-yellow-600" title="Awaiting Admin Finalization" count={groupedBookings.agentCompleted.length} badgeColor="bg-yellow-100 text-yellow-700" />
              <div className="space-y-4">
                {groupedBookings.agentCompleted.map((b) => (
                  <BookingCard key={b.id} booking={b} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {groupedBookings.completed.length > 0 && (
            <div>
              <SectionHeader icon={CheckCircle2} iconColor="bg-emerald-100 text-emerald-600" title="Completed" count={groupedBookings.completed.length} badgeColor="bg-emerald-100 text-emerald-700" />
              <div className="space-y-4">
                {groupedBookings.completed.map((b) => (
                  <BookingCard key={b.id} booking={b} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled */}
          {groupedBookings.cancelled.length > 0 && (
            <div>
              <SectionHeader icon={XCircle} iconColor="bg-gray-100 text-gray-500" title="Cancelled" count={groupedBookings.cancelled.length} badgeColor="bg-gray-100 text-gray-600" />
              <div className="space-y-4">
                {groupedBookings.cancelled.map((b) => (
                  <BookingCard key={b.id} booking={b} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected */}
          {groupedBookings.rejected.length > 0 && (
            <div>
              <SectionHeader icon={XCircle} iconColor="bg-red-100 text-red-500" title="Rejected" count={groupedBookings.rejected.length} badgeColor="bg-red-100 text-red-700" />
              <div className="space-y-4">
                {groupedBookings.rejected.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Accept Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showAcceptModal}
        title="Accept Booking"
        onClose={() => { setShowAcceptModal(false); setSelectedBooking(null); }}
        size="md"
        actions={[
          <Button key="cancel" variant="outline" onClick={() => setShowAcceptModal(false)}>Cancel</Button>,
          <Button key="confirm" onClick={confirmAccept} disabled={!!processingBookingId} className="bg-green-600 text-white hover:bg-green-700">
            {processingBookingId ? 'Processing...' : 'Confirm Accept'}
          </Button>,
        ]}
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <p className="text-sm text-green-700 font-semibold mb-1">YOU WILL EARN</p>
              <p className="text-4xl font-bold text-green-600 mb-1">{formatINR(selectedBooking.agentPayout)}</p>
              <p className="text-sm text-gray-600">for serving {selectedBooking.travelersCount} travelers</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: MapPin,    label: 'Destination', value: selectedBooking.package?.destination },
                { icon: Calendar,  label: 'Travel Date', value: new Date(selectedBooking.travelDate).toLocaleDateString() },
                { icon: Users,     label: 'Travelers',   value: `${selectedBooking.travelersCount} people` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-700">
              <strong>Note:</strong> Once you accept, you'll be responsible for customer satisfaction and on-time service delivery.
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reject Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showRejectModal}
        title="Reject Booking"
        onClose={() => { setShowRejectModal(false); setSelectedBooking(null); setRejectReason(''); setRejectMessage(''); }}
        size="md"
        actions={[
          <Button key="cancel" variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>,
          <Button key="confirm" onClick={confirmReject} disabled={processingBookingId || !rejectReason} className="bg-red-600 text-white hover:bg-red-700">
            {processingBookingId ? 'Processing...' : 'Confirm Rejection'}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700">
            Please let the admin know why you're rejecting this booking. This helps them better understand agent availability.
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-2">Reason for Rejection</label>
            <div className="space-y-2">
              {REJECT_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input type="radio" value={reason} checked={rejectReason === reason} onChange={(e) => setRejectReason(e.target.value)} className="w-4 h-4 accent-teal-600" />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-2">Additional Details (Optional)</label>
            <textarea
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              placeholder="Any additional context..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* ── Complete Modal ───────────────────────────────────────────────────── */}
      <Modal
        isOpen={showCompleteModal}
        title="Mark Booking Completed"
        onClose={() => { setShowCompleteModal(false); setSelectedBooking(null); }}
        size="md"
        actions={[
          <Button key="cancel" variant="outline" onClick={() => setShowCompleteModal(false)}>Cancel</Button>,
          <Button key="confirm" onClick={confirmComplete} disabled={!!processingBookingId} className="bg-amber-600 text-white hover:bg-amber-700">
            {processingBookingId ? 'Processing...' : 'Confirm Complete'}
          </Button>,
        ]}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-700">
              You're about to mark this trip as completed. This requests admin to finalize your payout.
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Package</p>
                <p className="text-sm font-semibold text-gray-900">{selectedBooking.package?.title || (selectedBooking.customRequest ? `Custom — ${selectedBooking.customRequest.destination}` : 'Custom Package')}</p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Travel Date</p>
                  <p className="text-sm font-semibold text-gray-900">{new Date(selectedBooking.travelDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

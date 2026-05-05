import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColorfulCard } from '../../components/ui/ColorfulCard';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { agentAPI, bookingsAPI } from '../../services/api';
import {
  Calendar, Users, MapPin, DollarSign, CheckCircle2, XCircle,
  Clock, AlertCircle, ThumbsUp, ThumbsDown, MessageSquare, Sparkles, ArrowRight
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

function BookingCard({ booking, onAccept, onReject, onView }) {
  const canAccept = booking.status === 'assigned';
  const isInProgress = booking.status === 'in_progress' || booking.status === 'accepted';
  // agent can mark complete when trip is in progress and not already completed or marked completed by agent
  const canComplete = isInProgress && booking.status !== 'completed' && booking.status !== 'completed_by_agent';
  const isCancelled = booking.status === 'cancelled';
  const statusLabel = booking.status === 'accepted' || booking.status === 'in_progress'
    ? 'IN PROGRESS'
    : booking.status.replace(/_/g, ' ').toUpperCase();
  
  return (
    <ColorfulCard variant="light" className="border-2 border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.package?.title}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {booking.package?.destination}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(booking.travelDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {booking.travelersCount} travelers
            </div>
          </div>
        </div>
        <Badge variant={
          booking.status === 'accepted' || booking.status === 'in_progress' ? 'success' :
          booking.status === 'rejected' ? 'error' :
          'info'
        }>
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200 mb-4">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 font-semibold mb-1">YOUR PAYOUT</p>
          <p className="text-2xl font-bold text-purple-600">{formatINR(booking.agentPayout)}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 font-semibold mb-1">TOTAL PACKAGE</p>
          <p className="text-2xl font-bold text-blue-600">{formatINR(booking.totalAmount)}</p>
        </div>
      </div>

      {canAccept && (
        <div className="flex gap-3">
          <Button
            onClick={() => onAccept(booking)}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2"
          >
            <ThumbsUp className="w-4 h-4" />
            Accept
          </Button>
          <Button
            onClick={() => onReject(booking)}
            variant="outline"
            className="flex-1 border-2 border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <ThumbsDown className="w-4 h-4" />
            Reject
          </Button>
        </div>
      )}
      {!canAccept && onView && (
        <div className="flex gap-3">
          <Button size="sm" onClick={() => onView(booking)} className="flex-1">
            View
          </Button>
          {canComplete && typeof onView === 'function' && (
            <Button size="sm" onClick={() => onView(booking, { action: 'complete' })} className="flex-1 bg-amber-600 text-white hover:bg-amber-700">
              Mark Complete
            </Button>
          )}
        </div>
      )}

      {isInProgress && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Trip is in progress. Mark it completed after the service ends.
        </div>
      )}

      {isCancelled && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          This booking was cancelled by admin.
        </div>
      )}
    </ColorfulCard>
  );
}

export function AgentBookingsNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [stats, setStats] = useState(null);

  // Modals
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

  useEffect(() => {
    loadBookings();
  }, []);

  const groupedBookings = useMemo(() => {
    const assigned = bookings.filter((b) => b.status === 'assigned');
    const inProgress = bookings.filter((b) => ['in_progress', 'accepted'].includes(b.status));
    const agentCompleted = bookings.filter((b) => b.status === 'completed_by_agent');
    const rejected = bookings.filter((b) => b.status === 'rejected');
    const completed = bookings.filter((b) => b.status === 'completed');
    const cancelled = bookings.filter((b) => b.status === 'cancelled');

    return { assigned, inProgress, agentCompleted, rejected, completed, cancelled };
  }, [bookings]);

  const statsData = useMemo(() => ({
    assigned: groupedBookings.assigned.length,
    inProgress: groupedBookings.inProgress.length,
    rejected: groupedBookings.rejected.length,
    totalEarnings: groupedBookings.completed.reduce((sum, b) => sum + Number(b.agentPayout || 0), 0),
  }), [groupedBookings]);

  const handleAcceptClick = (booking) => {
    setSelectedBooking(booking);
    setShowAcceptModal(true);
  };

  const handleViewClick = (booking, opts) => {
    // if invoked with action complete, open the confirm complete modal
    if (opts && opts.action === 'complete') {
      setSelectedBooking(booking);
      setShowCompleteModal(true);
      return;
    }

    navigate(`/agent/bookings/${booking.id}`, { state: { booking } });
  };

  const handleRejectClick = (booking) => {
    setSelectedBooking(booking);
    setRejectReason('');
    setRejectMessage('');
    setShowRejectModal(true);
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
    if (!rejectReason) {
      alert('Please select a reason');
      return;
    }

    try {
      setProcessingBookingId(selectedBooking.id);
      await bookingsAPI.updateStatus(selectedBooking.id, {
        status: 'rejected',
        rejection_reason: rejectReason,
        decision_remark: rejectMessage || undefined,
      });
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
      // mark as completed by agent — use existing 'completed' status and include remark so admin can differentiate
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
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Bookings</h1>
        <p className="text-gray-600">Manage assigned trips, move them to in progress, and close them out.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Clock} label="Pending Action" value={statsData.assigned} variant="blue" />
        <StatCard icon={CheckCircle2} label="In Progress" value={statsData.inProgress} variant="green" />
        <StatCard icon={XCircle} label="Rejected" value={statsData.rejected} variant="orange" />
        <StatCard icon={DollarSign} label="Total Earnings" value={formatINR(statsData.totalEarnings)} variant="purple" />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Assignments */}
          {groupedBookings.assigned.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Pending Your Action</h2>
                <Badge variant="info">{groupedBookings.assigned.length}</Badge>
              </div>
              <div className="space-y-4">
                {groupedBookings.assigned.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onAccept={handleAcceptClick}
                    onReject={handleRejectClick}
                    onView={handleViewClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Bookings */}
          {groupedBookings.inProgress.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">In Progress</h2>
                <Badge variant="success">{groupedBookings.inProgress.length}</Badge>
              </div>
              <div className="space-y-4">
                {groupedBookings.inProgress.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* Bookings Marked Completed By Agent (Awaiting Admin finalization) */}
          {groupedBookings.agentCompleted && groupedBookings.agentCompleted.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900">Awaiting Admin Finalization</h2>
                <Badge variant="info">{groupedBookings.agentCompleted.length}</Badge>
              </div>
              <div className="space-y-4">
                {groupedBookings.agentCompleted.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Bookings */}
          {groupedBookings.completed.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900">Completed</h2>
                <Badge variant="success">{groupedBookings.completed.length}</Badge>
              </div>
              <div className="space-y-4">
                {groupedBookings.completed.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Bookings */}
          {groupedBookings.cancelled.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">Cancelled</h2>
                <Badge variant="error">{groupedBookings.cancelled.length}</Badge>
              </div>
              <div className="space-y-4">
                {groupedBookings.cancelled.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onView={handleViewClick} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Bookings */}
          {groupedBookings.rejected.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">Rejected</h2>
                <Badge variant="error">{groupedBookings.rejected.length}</Badge>
              </div>
              <div className="space-y-4">
                {groupedBookings.rejected.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {bookings.length === 0 && (
            <ColorfulCard variant="gradient" className="overflow-hidden relative">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
                    <Sparkles className="w-4 h-4" />
                    No assigned trips yet
                  </div>
                  <h3 className="text-3xl font-bold mb-3">You are ready for assignments.</h3>
                  <p className="text-white/90 text-base leading-relaxed">
                    Browse the package catalog, opt in on trips you can handle, and wait for admin to assign you a booking.
                    Once assigned, this page will show the accept and reject actions here.
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button
                    onClick={() => navigate('/agent/packages')}
                    className="bg-white text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                  >
                    Browse Packages
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </ColorfulCard>
          )}
        </div>
      )}

      {/* Accept Modal */}
      <Modal
        isOpen={showAcceptModal}
        title="Accept Booking"
        onClose={() => {
          setShowAcceptModal(false);
          setSelectedBooking(null);
        }}
        size="md"
        actions={[
          <Button key="cancel" variant="outline" onClick={() => setShowAcceptModal(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            onClick={confirmAccept}
            disabled={processingBookingId}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {processingBookingId ? 'Processing...' : 'Confirm Accept'}
          </Button>,
        ]}
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-semibold mb-2">YOU WILL EARN</p>
              <p className="text-4xl font-bold text-green-600 mb-2">{formatINR(selectedBooking.agentPayout)}</p>
              <p className="text-sm text-gray-700">for serving {selectedBooking.travelersCount} travelers</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-semibold text-gray-900">{selectedBooking.package?.destination}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Travel Date</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedBooking.travelDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Travelers</p>
                  <p className="font-semibold text-gray-900">{selectedBooking.travelersCount} people</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Once you accept, you'll be responsible for customer satisfaction and on-time service delivery.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        title="Reject Booking"
        onClose={() => {
          setShowRejectModal(false);
          setSelectedBooking(null);
          setRejectReason('');
          setRejectMessage('');
        }}
        size="md"
        actions={[
          <Button key="cancel" variant="outline" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            onClick={confirmReject}
            disabled={processingBookingId || !rejectReason}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {processingBookingId ? 'Processing...' : 'Confirm Rejection'}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-sm text-red-700">
              Please let the admin know why you're rejecting this booking. This helps them better understand agent availability.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-2">Reason for Rejection</label>
            <div className="space-y-2">
              {REJECT_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-2">Additional Details (Optional)</label>
            <textarea
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              placeholder="Please provide any additional context..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        title="Mark Booking Completed"
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedBooking(null);
        }}
        size="md"
        actions={[
          <Button key="cancel" variant="outline" onClick={() => setShowCompleteModal(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            onClick={confirmComplete}
            disabled={processingBookingId}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {processingBookingId ? 'Processing...' : 'Confirm Complete'}
          </Button>,
        ]}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="text-sm text-amber-700">
                You're about to mark this trip as completed. This indicates you have finished the service and requests admin to finalize payout.
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Package</p>
              <p className="font-semibold text-gray-900">{selectedBooking.package?.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Travel Date</p>
                <p className="font-semibold text-gray-900">{new Date(selectedBooking.travelDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

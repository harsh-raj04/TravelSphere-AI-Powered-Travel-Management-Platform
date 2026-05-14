import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ColorfulCard } from '../../components/ui/ColorfulCard';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft, Calendar, Users, MapPin, Phone, Mail, CreditCard,
  DollarSign, CheckCircle2, Clock, AlertCircle, Star, RotateCcw, RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { humanizeStatus } from '../../utils/statusHelpers';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function AdminBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('booking_info');
  
  const [transaction, setTransaction] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [showAgentSelect, setShowAgentSelect] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigningId, setAssigningId] = useState('');
  
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const loadBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.bookings({ booking_id: id, limit: 1 });
      const foundBooking = res.data?.data?.items?.[0];
      if (foundBooking) {
        setBooking(foundBooking);
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (bookingId) => {
    try {
      const res = await adminAPI.bookingApplications(bookingId);
      setApplicants(res.data?.data?.items || []);
    } catch (err) {
      console.error('Failed to load applicants:', err);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [id]);

  useEffect(() => {
    if (booking?.id) {
      loadApplicants(booking.id);
      loadTransaction(booking.id);
    }
  }, [booking?.id]);

  const loadTransaction = async (bookingId) => {
    try {
      const res = await adminAPI.transactions({ booking_id: bookingId, limit: 1 });
      setTransaction(res.data?.data?.items?.[0] || null);
    } catch {
      setTransaction(null);
    }
  };

  useEffect(() => {
    if (booking?.id) {
      loadApplicants(booking.id);
      loadTransaction(booking.id);
    }
  }, [booking?.id]);

  const computeAgentReputation = (agent) => {
    const rating = Number(agent.rating ?? agent.agentRating ?? 0);
    const completedTrips = Number(agent.completedTrips ?? agent.tripCompletedCount ?? 0);
    const ongoingTrips = Number(agent.ongoingTrips ?? agent.tripAcceptedCount ?? 0);
    const rejectedTrips = Number(agent.rejectedTrips ?? agent.tripRejectedCount ?? 0);
    const assignedTrips = Number(agent.tripAssignedCount ?? 0);
    const ratingPercent = Number(agent.ratingPercent ?? Math.round(rating * 20));

    let score = ratingPercent;
    score += Math.min(completedTrips * 3, 35);
    score += Math.min(ongoingTrips * 2, 15);
    score -= rejectedTrips * 5;

    return {
      score: Math.max(0, Math.min(100, score)),
      rating,
      completedTrips,
      ongoingTrips,
      rejectedTrips,
      assignedTrips,
      acceptanceRate: assignedTrips > 0 ? ((assignedTrips - rejectedTrips) / assignedTrips * 100).toFixed(0) : 'N/A',
    };
  };

  const reputationClass = (score) => {
    if (score >= 85) return 'bg-green-50 border-green-300';
    if (score >= 65) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  const reputationText = (score) => {
    if (score >= 85) return 'text-green-700 font-semibold';
    if (score >= 65) return 'text-yellow-700 font-semibold';
    return 'text-red-700 font-semibold';
  };

  const handleAssignAgent = async () => {
    if (!selectedAgentId) {
      addToast('Please select an agent', 'error');
      return;
    }

    try {
      setAssigningId(selectedAgentId);
      // Use selectBookingApplication - selectedAgentId is a PackageInterest ID from opted-in agents
      await adminAPI.selectBookingApplication(booking.id, selectedAgentId);
      setApplicants(prev => prev.filter(a => a.id === selectedAgentId));
      await loadBooking();
      setShowAgentSelect(false);
      setSelectedAgentId('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to assign agent');
    } finally {
      setAssigningId('');
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      addToast('Please select a new status', 'error');
      return;
    }

    try {
      setStatusUpdating(true);
      await adminAPI.updateBookingStatus(booking.id, {
        status: newStatus,
        decision_remark: rejectionMessage || undefined,
      });
      await loadBooking();
      setNewStatus('');
      setRejectionMessage('');
      setShowRejectionForm(false);
      addToast('Status updated successfully', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleReassignAgent = async () => {
    if (!selectedAgentId) {
      addToast('Please select a new agent', 'error');
      return;
    }

    try {
      setAssigningId(selectedAgentId);
      await adminAPI.selectBookingApplication(booking.id, selectedAgentId);
      setApplicants(prev => prev.filter(a => a.id === selectedAgentId));
      await loadBooking();
      setShowAgentSelect(false);
      setSelectedAgentId('');
      addToast('Agent reassigned successfully', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to reassign agent', 'error');
    } finally {
      setAssigningId('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8">
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
          {error || 'Booking not found'}
        </div>
      </div>
    );
  }

  // State machine — only legal next statuses per current status
  // open_for_agents is a retired status; no transitions lead to it anymore
  const ALLOWED_TRANSITIONS = {
    pending:         ['confirmed', 'rejected', 'cancelled'],
    confirmed:       ['cancelled'],
    open_for_agents: ['confirmed', 'cancelled'],
    assigned:        ['cancelled'],
    accepted:        ['in_progress', 'cancelled'],
    in_progress:     ['completed', 'cancelled'],
    completed:       ['closed'],
    closed:          [],
    cancelled:       ['confirmed'],
    rejected:        ['confirmed'],
  };

  const ALL_STATUS_LABELS = {
    pending: 'Pending', confirmed: 'Confirmed', open_for_agents: 'Open for Agents',
    assigned: 'Assigned', accepted: 'Accepted', in_progress: 'In Progress',
    completed: 'Completed', closed: 'Closed', cancelled: 'Cancelled', rejected: 'Rejected',
  };

  const allowedNextStatuses = (ALLOWED_TRANSITIONS[booking.status] || []).map((s) => ({
    value: s,
    label: ALL_STATUS_LABELS[s] || s,
  }));

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
        <button onClick={() => navigate('/admin')} className="hover:text-gray-800 transition-colors">Dashboard</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate('/admin/bookings')} className="hover:text-gray-800 transition-colors">Bookings</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-medium">#{booking.id.slice(0, 8).toUpperCase()}</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/admin/bookings')} variant="outline" size="sm" className="flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to Bookings
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600">Order ID: {booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <Badge variant={
          booking.status === 'pending'         ? 'warning' :
          booking.status === 'confirmed'       ? 'info' :
          booking.status === 'open_for_agents' ? 'purple' :
          booking.status === 'assigned'        ? 'info' :
          booking.status === 'accepted'        ? 'accent' :
          booking.status === 'in_progress'     ? 'primary' :
          booking.status === 'completed'       ? 'success' :
          booking.status === 'closed'          ? 'neutral' :
          booking.status === 'cancelled'       ? 'error' :
          booking.status === 'rejected'        ? 'error' : 'neutral'
        }>
          {humanizeStatus(booking.status)}
        </Badge>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Travelers" value={booking.travelersCount} variant="blue" />
        <StatCard icon={DollarSign} label="Total Amount" value={formatINR(booking.totalAmount)} variant="green" />
        <StatCard icon={Calendar} label="Travel Date" value={new Date(booking.travelDate).toLocaleDateString()} variant="purple" />
        <StatCard icon={CheckCircle2} label="Agent Payout" value={formatINR(booking.agentPayout)} variant="orange" />
      </div>

      {/* Tabs */}
      <TabNavigation
        tabs={[
          { id: 'booking_info', label: 'Booking Info' },
          { id: 'payment', label: 'Payment' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* BOOKING INFO TAB */}
      {activeTab === 'booking_info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Left - Customer & Travel */}
          <div className="lg:col-span-2 space-y-6">
            <ColorfulCard variant="blue">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Customer Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{booking.contactEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{booking.contactPhone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{booking.customerName}</p>
                </div>
              </div>
            </ColorfulCard>

            <ColorfulCard variant="green">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Travel Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Package</p>
                  <p className="font-semibold text-gray-900">{booking.package?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-semibold text-gray-900">{booking.package?.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Travel Date</p>
                  <p className="font-semibold text-gray-900">{new Date(booking.travelDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{booking.package?.durationDays} days</p>
                </div>
              </div>
            </ColorfulCard>
          </div>

          {/* Right - Update Status */}
          <div>
            <ColorfulCard variant="orange">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Update Status</h3>

              {(booking.agentRejectionReason || booking.agentDecisionRemark) && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
                  <p className="font-semibold mb-1">Latest agent response</p>
                  {booking.agentRejectionReason && <p>Rejection reason: {booking.agentRejectionReason}</p>}
                  {booking.agentDecisionRemark && <p>Remark: {booking.agentDecisionRemark}</p>}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">New Status</label>
                  {allowedNextStatuses.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-2">No further status changes allowed for a <strong>{booking.status}</strong> booking.</p>
                  ) : (
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select new status...</option>
                      {allowedNextStatuses.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {newStatus && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Note</label>
                      <textarea
                        value={rejectionMessage}
                        onChange={(e) => setRejectionMessage(e.target.value)}
                        placeholder="Add notes or remarks..."
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {(newStatus === 'cancelled' || newStatus === 'rejected') ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-3">
                        <p className="text-sm text-red-800 font-medium">
                          This will <strong>{newStatus}</strong> the booking. This action may trigger financial reversals. Confirm?
                        </p>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleStatusUpdate}
                            disabled={statusUpdating}
                            className="flex-1 bg-red-600 text-white hover:bg-red-700"
                          >
                            {statusUpdating ? 'Updating...' : 'Confirm & Update'}
                          </Button>
                          <button
                            type="button"
                            onClick={() => setNewStatus('')}
                            className="text-sm text-red-700 underline hover:no-underline"
                          >
                            Go back
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={statusUpdating}
                        className="w-full bg-teal-600 text-white hover:bg-teal-700"
                      >
                        {statusUpdating ? 'Updating...' : 'Update Status'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </ColorfulCard>

            {/* Agent Assignment */}
            <ColorfulCard variant="purple">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Agent Assignment</h3>
              <p className="text-sm text-gray-600 mb-3">{applicants.length} agents opted in for this booking</p>
              
              {booking.assignedAgent ? (
                <>
                  <div className="bg-purple-50 p-3 rounded-lg mb-3">
                    <p className="font-semibold text-gray-900">{booking.assignedAgent.user?.name}</p>
                    <p className="text-sm text-gray-600">{booking.assignedAgent.city || booking.assignedAgent.agencyName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-gray-900">{Number(booking.assignedAgent.agentRating || 5).toFixed(1)}/5</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowAgentSelect(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Reassign Agent
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowAgentSelect(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                >
                  Assign Agent
                </Button>
              )}
            </ColorfulCard>
          </div>
        </div>
      )}

      {/* PAYMENT TAB */}
      {activeTab === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Transaction Details */}
          <ColorfulCard variant="light">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Transaction
            </h3>
            {transaction ? (
              <div className="space-y-3">
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-sm font-semibold">{transaction.transactionReference || transaction.id?.slice(0, 12) || 'N/A'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold capitalize">{transaction.paymentMethod || 'Razorpay'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={transaction.status === 'completed' ? 'success' : 'warning'}>{transaction.status || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold">{new Date(transaction.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold text-lg text-green-600">{formatINR(transaction.amount)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {booking.razorpayPaymentId && (
                  <div className="flex justify-between pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Razorpay Payment ID</span>
                    <span className="font-mono text-sm font-semibold">{booking.razorpayPaymentId}</span>
                  </div>
                )}
                {booking.razorpayOrderId && (
                  <div className="flex justify-between pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Razorpay Order ID</span>
                    <span className="font-mono text-sm font-semibold">{booking.razorpayOrderId}</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 italic">No transaction record found — showing booking payment IDs.</p>
              </div>
            )}
          </ColorfulCard>

          {/* Payment Breakdown */}
          <ColorfulCard variant="light">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Payment Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-700">Total Amount</span>
                <span className="font-semibold">{formatINR(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-700">Admin Margin (25%)</span>
                <span className="font-semibold text-red-600">-{formatINR(booking.totalAmount * 0.25)}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-700">GST (5%)</span>
                <span className="font-semibold text-red-600">-{formatINR(booking.totalAmount * 0.05)}</span>
              </div>
              <div className="flex justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg mt-2">
                <span className="font-bold">Agent Payout (70%)</span>
                <span className="text-lg font-bold text-green-600">{formatINR(booking.totalAmount * 0.70)}</span>
              </div>
            </div>
          </ColorfulCard>
        </div>
      )}

      {/* Agent Selection Modal */}
      <Modal
        isOpen={showAgentSelect}
        title={booking.assignedAgent ? 'Reassign Agent' : 'Assign Agent'}
        onClose={() => {
          setShowAgentSelect(false);
          setSelectedAgentId('');
        }}
        size="lg"
        actions={[
          <Button key="cancel" variant="outline" onClick={() => setShowAgentSelect(false)}>
            Cancel
          </Button>,
          <Button
            key="assign"
            onClick={booking.assignedAgent ? handleReassignAgent : handleAssignAgent}
            disabled={!selectedAgentId || assigningId}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {assigningId ? 'Assigning...' : booking.assignedAgent ? 'Reassign' : 'Assign'}
          </Button>,
        ]}
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {applicants.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No agents have opted in for this booking yet. Publish the booking to agents first.</p>
          ) : (
            applicants.map((app) => {
              const agent = app.agentProfile;
              const rep = computeAgentReputation(agent);
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAgentId(app.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAgentId === app.id ? 'border-blue-500 bg-blue-50' : `border-gray-200 ${reputationClass(rep.score)}`
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{agent?.name || 'Unknown Agent'}</p>
                      <p className="text-sm text-gray-600">{agent?.city || agent?.email}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${reputationText(rep.score)}`}>
                      {rep.score.toFixed(0)}/100
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-gray-600">Rating</p>
                      <p className="font-bold text-gray-900">{rep.rating}/5</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-gray-600">Completed</p>
                      <p className="font-bold text-gray-900">{rep.completedTrips}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-gray-600">Ongoing</p>
                      <p className="font-bold text-gray-900">{rep.ongoingTrips}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <p className="text-gray-600">Rejected</p>
                      <p className="font-bold text-red-600">{rep.rejectedTrips}</p>
                    </div>
                  </div>
                  <div className="mt-2 bg-white p-2 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-600">Acceptance Rate</p>
                    <p className="font-bold text-gray-900">{rep.acceptanceRate}%</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}

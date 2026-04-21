import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { agentAPI } from '../../services/api';
import { Calendar, User2, Package, Search, MessageSquare, IndianRupee, X } from 'lucide-react';

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

export function AgentBookings() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [updatingId, setUpdatingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [changeRequestBooking, setChangeRequestBooking] = useState(null);
  const [changeRemark, setChangeRemark] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await agentAPI.bookings();
      setItems(res.data?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bookings.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const customerName = item.customer?.name || '';
      const packageTitle = item.package?.title || '';
      const matchesSearch =
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        packageTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const updateStatus = async (id, payload) => {
    try {
      setUpdatingId(id);
      setError('');
      await agentAPI.updateBookingStatus(id, payload);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Status update failed.');
    } finally {
      setUpdatingId('');
    }
  };

  const requestChange = async (bookingId, remark) => {
    try {
      setUpdatingId(bookingId);
      setError('');
      await agentAPI.requestChange(bookingId, remark.trim());
      await loadData();
      setChangeRequestBooking(null);
      setChangeRemark('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send change request.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assigned Bookings</h1>
        <p className="text-gray-600">Accept, reject, and manage trips assigned by admin.</p>
      </div>

      <Card variant="elevated" className="p-5 bg-white border border-gray-200">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by customer or package"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </Card>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <p className="text-gray-600">Loading bookings...</p>
      ) : filteredItems.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center text-gray-600 bg-white border border-gray-200">No assigned bookings yet.</Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const canAcceptReject = item.status === 'assigned';
            const canStartProgress = item.status === 'accepted';
            const canMarkComplete = item.status === 'in_progress';

            return (
              <Card key={item.id} variant="elevated" className="p-5 bg-white border border-gray-200">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 inline-flex items-center gap-2">
                      <Package className="w-4 h-4" /> {item.package?.title || 'Package'}
                    </h3>
                    <p className="text-sm text-gray-600 inline-flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" /> {new Date(item.travelDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Earnings: <span className="font-semibold text-emerald-700">{formatINR(item.agentPayout)}</span></p>
                    <p className="text-sm text-gray-600 mt-1">Travelers: {item.travelersCount}</p>
                  </div>
                  <Badge variant={item.status === 'accepted' || item.status === 'in_progress' ? 'success' : item.status === 'assigned' ? 'warning' : 'neutral'}>{item.status}</Badge>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Customer Details</p>
                  <p className="text-sm text-gray-700 inline-flex items-center gap-2"><User2 className="w-4 h-4" /> {item.customer?.name || 'Customer'}</p>
                  <p className="text-xs text-gray-500 mt-1">Email: {item.customer?.contactEmail || 'Visible after acceptance'}</p>
                  <p className="text-xs text-gray-500">Phone: {item.customer?.contactPhone || 'Visible after acceptance'}</p>
                </div>

                {Array.isArray(item.package?.itinerary) && item.package.itinerary.length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-3 mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Itinerary</p>
                    <ul className="space-y-1">
                      {item.package.itinerary.map((dayPlan, idx) => (
                        <li key={`${item.id}-day-${idx}`} className="text-sm text-gray-700">Day {idx + 1}: {dayPlan}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {canAcceptReject && (
                    <>
                      <Button size="sm" disabled={updatingId === item.id} onClick={() => updateStatus(item.id, { status: 'accepted' })}>
                        Accept Booking
                      </Button>

                      <select
                        value={rejectionReasons[item.id] || ''}
                        onChange={(event) => setRejectionReasons((prev) => ({ ...prev, [item.id]: event.target.value }))}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
                      >
                        <option value="">Reject reason</option>
                        <option value="Not available">Not available</option>
                        <option value="Out of service area">Out of service area</option>
                        <option value="Capacity full">Capacity full</option>
                        <option value="Other">Other</option>
                      </select>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={updatingId === item.id}
                        onClick={() => updateStatus(item.id, {
                          status: 'rejected',
                          rejection_reason: rejectionReasons[item.id] || 'Other',
                        })}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {canStartProgress && (
                    <Button size="sm" disabled={updatingId === item.id} onClick={() => updateStatus(item.id, { status: 'in_progress' })}>
                      Start Trip
                    </Button>
                  )}

                  {canMarkComplete && (
                    <Button size="sm" disabled={updatingId === item.id} onClick={() => updateStatus(item.id, { status: 'completed', decision_remark: 'Trip completed by agent, awaiting admin closure' })}>
                      Mark Complete
                    </Button>
                  )}

                  <Button size="sm" variant="outline" disabled={updatingId === item.id} onClick={() => setChangeRequestBooking(item)}>
                    <MessageSquare className="w-4 h-4 mr-1" /> Request Change
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {changeRequestBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Request Change</h3>
              <button onClick={() => setChangeRequestBooking(null)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600">Send a change request to admin for this booking.</p>
              <textarea
                rows={4}
                value={changeRemark}
                onChange={(event) => setChangeRemark(event.target.value)}
                placeholder="Describe requested changes for admin"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setChangeRequestBooking(null)}>Cancel</Button>
                <Button
                  onClick={() => requestChange(changeRequestBooking.id, changeRemark)}
                  disabled={updatingId === changeRequestBooking.id || !changeRemark.trim()}
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

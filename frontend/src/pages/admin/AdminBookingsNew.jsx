import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColorfulCard } from '../../components/ui/ColorfulCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/LoadingSpinner';
import { humanizeStatus } from '../../utils/statusHelpers';
import { adminAPI } from '../../services/api';
import {
  Calendar, MapPin, Users, IndianRupee, Search, Filter, ArrowRight,
  AlertCircle, Clock, XCircle, CheckCircle2, ChevronLeft, ChevronRight, Plus, X
} from 'lucide-react';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const PAGE_SIZE = 20;

// Active booking statuses (agent workflow ongoing)
const ALL_STATUSES = [
  'confirmed', 'assigned', 'accepted', 'in_progress',
  'completed', 'closed', 'cancelled', 'rejected',
];

const statusColors = {
  pending:         'warning',
  confirmed:       'info',
  open_for_agents: 'purple',
  assigned:        'info',
  accepted:        'accent',
  in_progress:     'primary',
  completed:       'success',
  closed:          'neutral',
  cancelled:       'error',
  rejected:        'error',
};

const EMPTY_NEW_BOOKING = {
  customer_email: '',
  package_id: '',
  travel_date: '',
  travelers_count: 1,
  customer_name: '',
  contact_phone: '',
  travel_message: '',
};

export function AdminBookingsNew() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // New Booking Modal state
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState(EMPTY_NEW_BOOKING);
  const [newBookingPackages, setNewBookingPackages] = useState([]);
  const [newBookingError, setNewBookingError] = useState('');
  const [newBookingSubmitting, setNewBookingSubmitting] = useState(false);

  // Debounce search to avoid an API call per keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 when status filter changes
  useEffect(() => { setPage(1); }, [statusFilter]);

  // Fetch from server on page / filter / search change
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { page, limit: PAGE_SIZE };
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter) params.booking_status = statusFilter;
        const res = await adminAPI.bookings(params);
        if (!cancelled) {
          setBookings(res.data?.data?.items || []);
          setTotalItems(res.data?.data?.pagination?.total || 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load bookings');
          setBookings([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Global counts — fetched once on mount, not tied to current filter/page
  const [statusCounts, setStatusCounts] = useState({ total: 0, active: 0, completed: 0, cancelled: 0 });
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [totalRes, activeRes, completedRes, cancelledRes] = await Promise.all([
          adminAPI.bookings({ limit: 1 }),
          adminAPI.bookings({ limit: 1, booking_status: 'confirmed,assigned,accepted,in_progress' }),
          adminAPI.bookings({ limit: 1, booking_status: 'completed,closed' }),
          adminAPI.bookings({ limit: 1, booking_status: 'cancelled,rejected' }),
        ]);
        setStatusCounts({
          total:     totalRes.data?.data?.pagination?.total || 0,
          active:    activeRes.data?.data?.pagination?.total || 0,
          completed: completedRes.data?.data?.pagination?.total || 0,
          cancelled: cancelledRes.data?.data?.pagination?.total || 0,
        });
      } catch { /* non-fatal */ }
    };
    fetchCounts();
  }, []);

  const openNewBookingModal = async () => {
    setNewBookingForm(EMPTY_NEW_BOOKING);
    setNewBookingError('');
    setShowNewBooking(true);
    try {
      const res = await adminAPI.packages({ limit: 100, page: 1 });
      setNewBookingPackages(res.data?.data?.items || []);
    } catch {
      setNewBookingPackages([]);
    }
  };

  const handleNewBookingSubmit = async (e) => {
    e.preventDefault();
    setNewBookingError('');
    if (!newBookingForm.customer_email || !newBookingForm.package_id || !newBookingForm.travel_date || !newBookingForm.travelers_count) {
      setNewBookingError('Customer email, package, travel date, and traveler count are required.');
      return;
    }
    setNewBookingSubmitting(true);
    try {
      await adminAPI.createBookingForCustomer({
        ...newBookingForm,
        travelers_count: Number(newBookingForm.travelers_count),
      });
      setShowNewBooking(false);
      setNewBookingForm(EMPTY_NEW_BOOKING);
      // Refetch bookings
      setPage(1);
    } catch (err) {
      setNewBookingError(err?.response?.data?.message || 'Failed to create booking.');
    } finally {
      setNewBookingSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Management</h1>
          <p className="text-gray-600">View and manage all customer bookings</p>
        </div>
        <Button
          onClick={openNewBookingModal}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid — clickable cards filter the list */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bookings',  value: statusCounts.total,     icon: Users,         color: 'bg-blue-50 text-blue-700 border-blue-200',   filter: '' },
          { label: 'Active',          value: statusCounts.active,    icon: Clock,         color: 'bg-amber-50 text-amber-700 border-amber-200', filter: 'confirmed' },
          { label: 'Completed',       value: statusCounts.completed, icon: CheckCircle2,  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', filter: 'completed' },
          { label: 'Cancelled',       value: statusCounts.cancelled, icon: XCircle,       color: 'bg-red-50 text-red-700 border-red-200',     filter: 'cancelled' },
        ].map(({ label, value, icon: Icon, color, filter }) => (
          <button
            key={label}
            onClick={() => { setStatusFilter(f => f === filter && filter !== '' ? '' : filter); setPage(1); }}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${color} ${statusFilter === filter && filter !== '' ? 'ring-2 ring-offset-1 ring-current' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 opacity-70" />
              <span className="text-xs font-medium opacity-80">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, package, destination…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="relative sm:w-52">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>{humanizeStatus(status)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <PageSpinner />
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No bookings found</p>
          <p className="text-sm text-gray-400 mb-4">
            {statusFilter || searchTerm ? 'Try clearing the filter or search term.' : 'No bookings have been created yet.'}
          </p>
          {(statusFilter || searchTerm) ? (
            <button onClick={() => { setStatusFilter(''); setSearchTerm(''); }} className="text-sm text-blue-600 hover:underline">
              Clear filters
            </button>
          ) : (
            <Button onClick={openNewBookingModal} className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" /> Create First Booking
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
                {/* Left Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    {/* Package Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {booking.package?.title || (booking.customRequest ? `Custom — ${booking.customRequest.destination}` : 'Custom Package')}
                      </h3>

                      {/* Meta Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{booking.package?.destination || booking.customRequest?.destination}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-600">
                            {new Date(booking.travelDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{booking.travelersCount} travelers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm font-semibold text-green-600">{formatINR(booking.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="text-sm text-gray-600">
                        <p><strong>{booking.customerName}</strong> • {booking.contactEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Content - Status & Action */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusColors[booking.status] || 'default'}>
                      {humanizeStatus(booking.status)}
                    </Badge>
                    {booking.assignedAgent && (
                      <div className="text-xs text-gray-600">
                        Assigned to: <strong>{booking.assignedAgent.user?.name}</strong>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                    >
                      Manage
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalItems)}–{Math.min(page * PAGE_SIZE, totalItems)} of {totalItems} bookings
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const num = start + i;
              return num <= totalPages ? (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    num === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {num}
                </button>
              ) : null;
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Booking</h3>
              <button onClick={() => setShowNewBooking(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleNewBookingSubmit} className="p-5 space-y-4">
              {newBookingError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{newBookingError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={newBookingForm.customer_email}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, customer_email: e.target.value }))}
                  placeholder="customer@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package <span className="text-red-500">*</span></label>
                <select
                  required
                  value={newBookingForm.package_id}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, package_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a package...</option>
                  {newBookingPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.title} — ₹{Number(pkg.price).toLocaleString('en-IN')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newBookingForm.travel_date}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, travel_date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Travelers <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newBookingForm.travelers_count}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, travelers_count: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={newBookingForm.customer_name}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Override name (leave blank to use account name)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="tel"
                  value={newBookingForm.contact_phone}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="+91 9999999999"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  value={newBookingForm.travel_message}
                  onChange={(e) => setNewBookingForm((prev) => ({ ...prev, travel_message: e.target.value }))}
                  placeholder="Any special requirements or notes..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBooking(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newBookingSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {newBookingSubmitting ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

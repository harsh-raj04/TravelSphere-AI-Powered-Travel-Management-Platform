import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColorfulCard } from '../../components/ui/ColorfulCard';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { adminAPI } from '../../services/api';
import {
  Calendar, MapPin, Users, IndianRupee, Search, Filter, ArrowRight,
  AlertCircle, CheckCircle2, Clock
} from 'lucide-react';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const statusColors = {
  pending: 'warning',
  confirmed: 'info',
  open_for_agents: 'warning',
  assigned: 'info',
  accepted: 'success',
  rejected: 'error',
  in_progress: 'info',
  completed: 'success',
  closed: 'default',
  cancelled: 'error',
};

export function AdminBookingsNew() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.bookings({ limit: 100 });
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

  const statuses = useMemo(
    () => [...new Set((bookings || []).map((b) => b.status))],
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    return (bookings || []).filter((booking) => {
      const matchesSearch =
        booking.package?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: bookings.length,
    needsAction: bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length,
    assigned: bookings.filter((b) => b.status === 'assigned').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  }), [bookings]);

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Management</h1>
        <p className="text-gray-600">View and manage all customer bookings</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Bookings" value={stats.total} variant="blue" />
        <StatCard icon={Clock} label="Needs Action" value={stats.needsAction} variant="orange" />
        <StatCard icon={ArrowRight} label="Assigned" value={stats.assigned} variant="purple" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} variant="green" />
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative md:col-span-2">
          <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
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
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{booking.package?.title}</h3>
                      
                      {/* Meta Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{booking.package?.destination}</span>
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
                      {booking.status.replace(/_/g, ' ').toUpperCase()}
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
    </div>
  );
}

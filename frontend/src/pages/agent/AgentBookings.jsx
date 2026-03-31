import { useEffect, useMemo, useState, useContext } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { agentAPI } from '../../services/api';
import { BookingEventContext } from '../../contexts/BookingEventContext';
import { Calendar, User2, Package, Search, Filter, CheckCircle, Clock } from 'lucide-react';

const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

export function AgentBookings() {
  const { emit } = useContext(BookingEventContext);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [updatingId, setUpdatingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

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
      const customerName = item.customer?.name || item.customer?.email || '';
      const packageTitle = item.package?.title || '';
      const matchesSearch =
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        packageTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const overview = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      confirmed: items.filter((i) => i.status === 'confirmed').length,
      revenue: items
        .filter((i) => i.status === 'confirmed' || i.status === 'completed')
        .reduce((acc, i) => acc + Number(i.totalAmount || 0), 0),
    };
  }, [items]);

  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      setError('');
      await agentAPI.updateBookingStatus(id, status);
      await loadData();
      
      // Emit appropriate event
      if (status === 'cancelled') {
        emit('booking:cancelled', { bookingId: id, newStatus: status });
      } else if (status === 'confirmed') {
        emit('booking:confirmed', { bookingId: id, newStatus: status });
      } else if (status === 'completed') {
        emit('booking:completed', { bookingId: id, newStatus: status });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Status update failed.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings</h1>
        <p className="text-gray-600">Manage all customer bookings and reservations</p>
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

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="outline" className="shrink-0"><Filter className="w-4 h-4 mr-1" /> Filters</Button>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-4 bg-white border border-gray-200"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" />{overview.total}</p></Card>
        <Card variant="elevated" className="p-4 bg-white border border-gray-200"><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold inline-flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-600" />{overview.pending}</p></Card>
        <Card variant="elevated" className="p-4 bg-white border border-gray-200"><p className="text-xs text-gray-500">Confirmed</p><p className="text-2xl font-bold inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />{overview.confirmed}</p></Card>
        <Card variant="elevated" className="p-4 bg-white border border-gray-200"><p className="text-xs text-gray-500">Revenue</p><p className="text-2xl font-bold text-gray-900">{formatINR(overview.revenue)}</p></Card>
      </section>

      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {loading ? (
        <p className="text-gray-600">Loading bookings...</p>
      ) : filteredItems.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center text-gray-600 bg-white border border-gray-200">No bookings for your packages yet.</Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id} variant="elevated" className="p-5 bg-white border border-gray-200">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 inline-flex items-center gap-2">
                    <Package className="w-4 h-4" /> {item.package?.title || 'Package'}
                  </h3>
                  <p className="text-sm text-gray-600 inline-flex items-center gap-2 mt-1">
                    <User2 className="w-4 h-4" /> {item.customer?.name || item.customer?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600 inline-flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" /> {new Date(item.travelDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={item.status === 'confirmed' ? 'success' : item.status === 'pending' ? 'warning' : 'neutral'}>{item.status}</Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                <div>
                  <p className="text-sm text-gray-600">Travelers: {item.travelersCount}</p>
                  <p className="text-xl font-bold text-gray-900">{formatINR(item.totalAmount)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={item.status === status ? 'primary' : 'secondary'}
                      disabled={updatingId === item.id || item.status === status}
                      onClick={() => updateStatus(item.id, status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

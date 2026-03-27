import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { agentAPI } from '../../services/api';
import { Calendar, User2, Package } from 'lucide-react';

const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];

export function AgentBookings() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [updatingId, setUpdatingId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await agentAPI.bookings();
      setItems(res.data?.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      await agentAPI.updateBookingStatus(id, status);
      await loadData();
    } catch {
      window.alert('Status update failed.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Agent Booking Management</h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Review requests and update booking statuses.</p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-4"><p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Total</p><p className="text-2xl font-bold">{overview.total}</p></Card>
        <Card variant="elevated" className="p-4"><p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Pending</p><p className="text-2xl font-bold">{overview.pending}</p></Card>
        <Card variant="elevated" className="p-4"><p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Confirmed</p><p className="text-2xl font-bold">{overview.confirmed}</p></Card>
        <Card variant="elevated" className="p-4"><p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Revenue</p><p className="text-2xl font-bold">₹{overview.revenue.toLocaleString()}</p></Card>
      </section>

      {loading ? (
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading bookings...</p>
      ) : items.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">No bookings for your packages yet.</Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} variant="elevated" className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary inline-flex items-center gap-2">
                    <Package className="w-4 h-4" /> {item.package?.title || 'Package'}
                  </h3>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary inline-flex items-center gap-2 mt-1">
                    <User2 className="w-4 h-4" /> {item.customer?.name || item.customer?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary inline-flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" /> {new Date(item.travelDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={item.status === 'confirmed' ? 'success' : item.status === 'pending' ? 'warning' : 'neutral'}>{item.status}</Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-light-border dark:border-dark-border pt-4">
                <div>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Travelers: {item.travelersCount}</p>
                  <p className="text-xl font-bold text-brand-primary dark:text-brand-secondary">₹{Number(item.totalAmount || 0).toLocaleString()}</p>
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

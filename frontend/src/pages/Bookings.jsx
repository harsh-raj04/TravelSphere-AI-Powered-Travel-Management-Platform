import { useEffect, useState, useContext } from 'react';
import { bookingsAPI } from '../services/api';
import { BookingEventContext } from '../contexts/BookingEventContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plane, Hotel, TrendingDown } from 'lucide-react';

export function Bookings() {
  const { on } = useContext(BookingEventContext);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('my-bookings');

  useEffect(() => {
    // Fetch bookings function
    const fetchBookings = async () => {
      console.log('[Bookings] Fetching bookings...');
      try {
        const res = await bookingsAPI.myBookings();
        console.log('[Bookings] Got response:', res.data?.data?.items?.length, 'items');
        setItems(res.data?.data?.items || []);
      } catch (err) {
        console.error('[Bookings] Error fetching:', err.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch on mount
    fetchBookings();

    // Listen for booking events and refetch
    const unsubscribe = on('booking:created', () => {
      console.log('[Bookings] Event-based refresh triggered');
      fetchBookings();
    });

    return unsubscribe;
  }, [on]);

  return (
    <div className="py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">Bookings</h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Manage your package bookings and compare flight/hotel deals.</p>
      </div>

      <div className="inline-flex rounded-lg p-1 bg-light-bg-secondary dark:bg-dark-bg-tertiary gap-1">
        {[
          { key: 'my-bookings', label: 'My Bookings' },
          { key: 'flights', label: 'Flights' },
          { key: 'hotels', label: 'Hotels' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.key
                ? 'bg-white dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary shadow-sm'
                : 'text-light-text-secondary dark:text-dark-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'my-bookings' && (
        loading ? (
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading bookings...</p>
        ) : items.length === 0 ? (
          <Card variant="elevated" className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
            No bookings found.
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} variant="elevated" className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">
                      {item.package?.title || 'Travel Package'}
                    </h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {item.package?.destination || 'Destination'} • {new Date(item.travelDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={item.status === 'confirmed' ? 'success' : 'warning'}>{item.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Travelers: {item.travelersCount}
                </p>
                <p className="text-xl font-bold text-brand-primary dark:text-brand-secondary mt-1">
                  ₹{Number(item.totalAmount || 0).toLocaleString()}
                </p>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'flights' && (
        <div className="grid md:grid-cols-2 gap-5">
          {[{ airline: 'SkyAir', route: 'BLR -> GOI', price: 5299 }, { airline: 'Pacific Wings', route: 'DEL -> IXC', price: 6199 }].map((f) => (
            <Card key={f.airline} variant="elevated" className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-2 font-semibold text-light-text-primary dark:text-dark-text-primary">
                  <Plane className="w-4 h-4" /> {f.airline}
                </div>
                <Badge variant="success" className="inline-flex items-center gap-1"><TrendingDown className="w-3 h-3" /> deal</Badge>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{f.route} • 1 stop • 3h 25m</p>
              <p className="text-2xl font-bold text-brand-primary dark:text-brand-secondary mb-3">₹{f.price.toLocaleString()}</p>
              <Button size="sm">Select Flight</Button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'hotels' && (
        <div className="grid md:grid-cols-2 gap-5">
          {[{ name: 'Beachfront Resort', place: 'Goa', price: 4899 }, { name: 'Himalayan Retreat', place: 'Manali', price: 3599 }].map((h) => (
            <Card key={h.name} variant="elevated" className="p-5">
              <div className="inline-flex items-center gap-2 font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                <Hotel className="w-4 h-4" /> {h.name}
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{h.place} • 4.7 rating</p>
              <p className="text-2xl font-bold text-brand-primary dark:text-brand-secondary mb-3">₹{h.price.toLocaleString()} <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">/night</span></p>
              <Button size="sm">Book Hotel</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../services/api';
import { BookingEventContext } from '../contexts/BookingEventContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Calendar, MapPin, Users } from 'lucide-react';

export function MyTrips() {
  const { on } = useContext(BookingEventContext);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    // Fetch trips function
    const fetchTrips = async () => {
      console.log('[MyTrips] Fetching trips...');
      try {
        const res = await bookingsAPI.myBookings();
        console.log('[MyTrips] Got response:', res.data?.data?.items?.length, 'items');
        setTrips(res.data?.data?.items || []);
      } catch (err) {
        console.error('[MyTrips] Error fetching:', err.message);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch on mount
    fetchTrips();

    // Listen for all booking events and refetch
    const unsubscribeCreated = on('booking:created', () => {
      console.log('[MyTrips] booking:created event - refetching');
      fetchTrips();
    });

    const unsubscribeCancelled = on('booking:cancelled', () => {
      console.log('[MyTrips] booking:cancelled event - refetching');
      fetchTrips();
    });

    const unsubscribeCompleted = on('booking:completed', () => {
      console.log('[MyTrips] booking:completed event - refetching');
      fetchTrips();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeCancelled();
      unsubscribeCompleted();
    };
  }, [on]);

  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">My Trips</h1>
        <Link to="/discover"><Button>Plan Another Trip</Button></Link>
      </div>

      {loading ? (
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading trips...</p>
      ) : trips.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center">
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">No trips yet.</p>
          <Link to="/discover"><Button>Explore Packages</Button></Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {trips.map((trip) => (
            <Card key={trip.id} variant="elevated" className="p-5">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-xl text-light-text-primary dark:text-dark-text-primary">
                  {trip.package?.title || 'Travel Package'}
                </h3>
                <Badge variant="success">{trip.status}</Badge>
              </div>
              <div className="space-y-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <p className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {trip.package?.destination || 'Destination'}</p>
                <p className="inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(trip.travelDate).toLocaleDateString()}</p>
                <p className="inline-flex items-center gap-2"><Users className="w-4 h-4" /> {trip.travelersCount} travelers</p>
              </div>
              <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                <p className="text-2xl font-bold text-brand-primary dark:text-brand-secondary">₹{Number(trip.totalAmount || 0).toLocaleString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

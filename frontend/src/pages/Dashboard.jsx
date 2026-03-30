import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { Compass, Calendar, Plane, Sparkles, TrendingUp, MapPin, ArrowRight, Clock } from 'lucide-react';
import { bookingsAPI, packagesAPI } from '../services/api';

export function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [bookingsRes, packagesRes] = await Promise.all([
          bookingsAPI.myBookings(),
          packagesAPI.list({ page: 1, limit: 10 }),
        ]);
        setBookings(bookingsRes.data?.data?.items || []);
        setPackages(packagesRes.data?.data?.items || []);
      } catch (_error) {
        setBookings([]);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcomingTrips = useMemo(() => {
    return bookings
      .filter((booking) => new Date(booking.travelDate) > new Date())
      .sort((a, b) => new Date(a.travelDate) - new Date(b.travelDate))
      .slice(0, 2)
      .map((booking) => ({
        id: booking.id,
        destination: booking.package?.destination || 'Destination TBD',
        date: booking.travelDate,
        progress: booking.status === 'confirmed' ? 80 : booking.status === 'pending' ? 40 : 20,
      }));
  }, [bookings]);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const upcomingCount = bookings.filter((b) => new Date(b.travelDate) > new Date()).length;
    const uniqueDestinations = new Set(bookings.map((b) => b.package?.destination)).size;
    const travelScore = Math.min(100, 50 + Math.floor(totalBookings * 5) + Math.floor(uniqueDestinations * 10));

    return [
      { label: 'Trips Planned', value: String(totalBookings), icon: Plane, tone: 'text-blue-600 dark:text-blue-400' },
      { label: 'Destinations', value: String(uniqueDestinations), icon: Compass, tone: 'text-cyan-600 dark:text-cyan-400' },
      { label: 'Upcoming Bookings', value: String(upcomingCount), icon: Calendar, tone: 'text-violet-600 dark:text-violet-400' },
      { label: 'Travel Score', value: String(travelScore), icon: TrendingUp, tone: 'text-emerald-600 dark:text-emerald-400' },
    ];
  }, [bookings]);

  const recommended = useMemo(() => {
    return packages.slice(0, 2).map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      match: `${Math.floor(Math.random() * 20) + 80}% match`,
      desc: pkg.description || 'Well-curated travel package for you.',
    }));
  }, [packages]);

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-400 py-10">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-8 py-10">
      <section className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 mb-4 text-sm font-semibold uppercase tracking-wide">
            <Sparkles className="w-4 h-4" />
            AI Travel Companion
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Explorer'}
          </h1>
          <p className="text-white/90 mb-6 max-w-2xl">
            Continue your journeys with curated recommendations and quick actions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/discover">
              <Button variant="secondary">Explore Packages</Button>
            </Link>
            <Link to="/plan">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-700">
                Plan New Trip
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/15 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-white/10 rounded-full" />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} variant="elevated" className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{item.label}</p>
                <Icon className={`w-5 h-5 ${item.tone}`} />
              </div>
              <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{item.value}</p>
            </Card>
          );
        })}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Recommended For You</h2>
          <Link to="/discover" className="text-sm font-semibold text-brand-primary dark:text-brand-secondary inline-flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {recommended.map((rec) => (
            <Card key={rec.id} variant="elevated" hover className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">{rec.title}</h3>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{rec.desc}</p>
                </div>
                <Badge variant="primary">{rec.match}</Badge>
              </div>
              <Link to={`/packages/${rec.id}`}>
                <Button size="sm">View Package</Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Upcoming Trips</h2>
          <Link to="/trips" className="text-sm font-semibold text-brand-primary dark:text-brand-secondary inline-flex items-center gap-1">
            Manage trips <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {upcomingTrips.map((trip) => (
            <Card key={trip.id} variant="elevated" className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {trip.destination}
                </h3>
                <Badge variant="primary">{trip.progress}% planned</Badge>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary inline-flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" /> {new Date(trip.date).toLocaleDateString()}
              </p>
              <div className="w-full bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-full h-2 mb-4">
                <div className="h-2 rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600" style={{ width: `${trip.progress}%` }} />
              </div>
              <Link to={`/packages/${trip.id}`}>
                <Button size="sm" variant="secondary">Open Itinerary</Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-5">
        <Card variant="elevated" className="p-5">
          <h3 className="font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/discover"><Button variant="secondary" size="sm">Discover</Button></Link>
            <Link to="/trips"><Button variant="secondary" size="sm">My Trips</Button></Link>
            <Link to="/bookings"><Button variant="secondary" size="sm">Bookings</Button></Link>
          </div>
        </Card>

        <Card variant="elevated" className="p-5">
          <h3 className="font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">Travel Tip</h3>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Prices are usually lower when you book at least 30 days in advance for peak season destinations.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-brand-primary dark:text-brand-secondary">
            <MapPin className="w-4 h-4" /> Compare packages by destination weather
          </div>
        </Card>
      </section>
    </div>
  );
}

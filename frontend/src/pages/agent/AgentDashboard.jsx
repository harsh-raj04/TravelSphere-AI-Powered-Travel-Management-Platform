import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { packagesAPI, agentAPI } from '../../services/api';
import { Package, Wallet, CalendarCheck2, TrendingUp, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function AgentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myPackages, setMyPackages] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [pkgRes, bookingRes] = await Promise.all([
          packagesAPI.list({ page: 1, limit: 100 }),
          agentAPI.bookings(),
        ]);

        const allPackages = pkgRes.data?.data?.items || [];
        const mine = allPackages.filter((pkg) => pkg.agent?.user?.id === user?.id);

        setMyPackages(mine);
        setBookings(bookingRes.data?.data?.items || []);
      } catch {
        setMyPackages([]);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0);
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const pending = bookings.filter((b) => b.status === 'pending').length;

    return {
      packages: myPackages.length,
      revenue: totalRevenue,
      confirmed,
      pending,
    };
  }, [myPackages, bookings]);

  const recentBookings = bookings.slice(0, 4);

  return (
    <div className="py-10 space-y-8">
      <section className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600">
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-wide font-semibold text-white/90 mb-3">Agent Workspace</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome, {user?.name || user?.email?.split('@')[0] || 'Agent'}
          </h1>
          <p className="text-white/90 max-w-2xl mb-6">Create packages, manage bookings, and track your performance in one place.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/agent/packages/new"><Button variant="secondary">Create Package</Button></Link>
            <Link to="/agent/bookings"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-700">Review Bookings</Button></Link>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/15 rounded-full" />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-5"><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">My Packages</p><p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{stats.packages}</p><Package className="w-5 h-5 mt-2 text-sky-600 dark:text-sky-400" /></Card>
        <Card variant="elevated" className="p-5"><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Total Revenue</p><p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">₹{stats.revenue.toLocaleString()}</p><Wallet className="w-5 h-5 mt-2 text-emerald-600 dark:text-emerald-400" /></Card>
        <Card variant="elevated" className="p-5"><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Confirmed</p><p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{stats.confirmed}</p><CalendarCheck2 className="w-5 h-5 mt-2 text-indigo-600 dark:text-indigo-400" /></Card>
        <Card variant="elevated" className="p-5"><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Pending</p><p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{stats.pending}</p><TrendingUp className="w-5 h-5 mt-2 text-fuchsia-600 dark:text-fuchsia-400" /></Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Recent Booking Requests</h2>
          <Link to="/agent/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary dark:text-brand-secondary">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading dashboard...</p>
        ) : recentBookings.length === 0 ? (
          <Card variant="elevated" className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">No booking requests yet.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {recentBookings.map((booking) => (
              <Card key={booking.id} variant="elevated" className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">{booking.package?.title || 'Package'}</h3>
                  <Badge variant={booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'warning' : 'neutral'}>
                    {booking.status}
                  </Badge>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Customer: {booking.customer?.name || booking.customer?.email || 'Unknown'}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">Travel date: {new Date(booking.travelDate).toLocaleDateString()}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-brand-primary dark:text-brand-secondary">₹{Number(booking.totalAmount || 0).toLocaleString()}</p>
                  <Link to="/agent/bookings"><Button size="sm" variant="secondary">Manage</Button></Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">Package Performance</h2>
        {myPackages.length === 0 ? (
          <Card variant="elevated" className="p-8 text-center">
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">You have not created packages yet.</p>
            <Link to="/agent/packages/new"><Button>Create First Package</Button></Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {myPackages.slice(0, 4).map((pkg) => (
              <Card key={pkg.id} variant="elevated" className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">{pkg.title}</h3>
                  <Badge variant="primary">Active</Badge>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">{pkg.destination} • {pkg.durationDays} days</p>
                <div className="w-full bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-full h-2 mb-3">
                  <div className="h-2 rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600" style={{ width: `${Math.min(95, 35 + pkg.durationDays * 6)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-brand-primary dark:text-brand-secondary">₹{Number(pkg.price || 0).toLocaleString()}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-light-text-tertiary dark:text-dark-text-tertiary"><Star className="w-3 h-3" /> trend score</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

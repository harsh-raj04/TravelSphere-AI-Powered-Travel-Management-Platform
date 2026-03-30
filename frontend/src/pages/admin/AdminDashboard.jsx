import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Award,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { KPICard } from '../../components/admin/KPICard';
import { useAutoRefetch } from '../../hooks/useAutoRefetch';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { adminAPI } from '../../services/api';

const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);

  const fetchData = async () => {
    try {
      const [overviewRes, bookingsRes] = await Promise.all([
        adminAPI.analyticsOverview(),
        adminAPI.bookings({ page: 1, limit: 8 }),
      ]);
      setOverview(overviewRes.data?.data || null);
      setBookings(bookingsRes.data?.data?.items || []);
    } catch (_error) {
      // Error already logged by axios
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refetch data every 5 seconds when tab is visible
  useAutoRefetch(fetchData, [], 5000);

  const revenueData = useMemo(() => {
    const trend = overview?.revenue_trend || [];
    const countMap = new Map((overview?.booking_trend || []).map((item) => [item.date, item.count]));

    return trend.map((item) => ({
      month: new Date(item.date).toLocaleDateString('en-IN', { month: 'short' }),
      revenue: Number(item.revenue || 0),
      bookings: Number(countMap.get(item.date) || 0),
    }));
  }, [overview]);

  const packagePopularityData = useMemo(
    () =>
      (overview?.top_packages || []).map((pkg) => ({
        name: pkg.package_title,
        bookings: pkg.total_bookings,
      })),
    [overview]
  );

  const totalRevenue = Number(overview?.total_revenue || 0);
  const totalBookings = Number(overview?.total_bookings || 0);
  const activeAgents = (overview?.top_agents || []).length;
  const conversionRate = Number(overview?.payment_success_rate || 0);

  const topAgent = (overview?.top_agents || [])[0];
  const mostBooked = (overview?.top_packages || [])[0];

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Revenue" value={formatINR(totalRevenue)} icon={DollarSign} iconColor="text-emerald-500" trend={{ value: 12.5, isPositive: true }} />
        <KPICard title="Total Bookings" value={totalBookings} icon={Calendar} iconColor="text-blue-500" trend={{ value: 8.2, isPositive: true }} />
        <KPICard title="Active Agents" value={activeAgents} icon={Users} iconColor="text-purple-500" trend={{ value: 0, isPositive: true }} />
        <KPICard title="Payment Success" value={`${conversionRate}%`} icon={TrendingUp} iconColor="text-amber-500" trend={{ value: 3.8, isPositive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue & Bookings Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="left" stroke="#10B981" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue (₹)" />
              <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Packages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={packagePopularityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis dataKey="name" type="category" stroke="#6B7280" style={{ fontSize: '12px' }} width={120} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#3B82F6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Insights</h3>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
            <Award className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Top Performing Agent</p>
            <p className="text-xl font-semibold mb-1">{topAgent?.agent_name || 'N/A'}</p>
            <p className="text-sm opacity-80">{topAgent?.total_bookings || 0} bookings</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white">
            <MapPin className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Most Booked Package</p>
            <p className="text-xl font-semibold mb-1">{mostBooked?.package_title || 'N/A'}</p>
            <p className="text-sm opacity-80">{mostBooked?.total_bookings || 0} total bookings</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white">
            <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Needs Attention</p>
            <p className="text-xl font-semibold mb-1">Operational Alerts</p>
            <p className="text-sm opacity-80">Check pending and failed statuses</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
            <a href="/admin/bookings" className="text-sm text-blue-500 hover:text-blue-600 font-medium">View all →</a>
          </div>
          <div className="space-y-4">
            {bookings.length === 0 && <p className="text-sm text-gray-500">No bookings found.</p>}
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{booking.customer?.name || booking.customer?.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{booking.package?.title}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatINR(booking.totalAmount)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(booking.bookingDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                    booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

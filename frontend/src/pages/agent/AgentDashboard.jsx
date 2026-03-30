import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  MapPin,
  Star,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { packagesAPI, agentAPI } from '../../services/api';
import { useAutoRefetch } from '../../hooks/useAutoRefetch';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

function StatCard({ title, value, change, icon: Icon, iconColor, iconBg }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-4xl leading-none font-bold text-gray-900 mb-3">{value}</h3>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-green-600">↑ {change}</span>
            <span className="text-sm text-gray-500">vs last month</span>
          </div>
        </div>
        <div className={`${iconBg} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export function AgentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myPackages, setMyPackages] = useState([]);
  const [bookings, setBookings] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [pkgRes, bookingRes] = await Promise.all([
        packagesAPI.list({ page: 1, limit: 100 }),
        agentAPI.bookings(),
      ]);

      const allPackages = pkgRes.data?.data?.items || [];
      const mine = allPackages.filter((pkg) => pkg.agent?.user?.id === user?.id);

      setMyPackages(mine);
      setBookings(bookingRes.data?.data?.items || []);
    } catch (_error) {
      // Error already logged by axios
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refetch bookings every 5 seconds when tab is visible
  useAutoRefetch(fetchData, 5000);

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((acc, booking) => acc + Number(booking.totalAmount || 0), 0);
    const confirmed = bookings.filter((booking) => booking.status === 'confirmed').length;
    const conversionRate = bookings.length ? Math.round((confirmed / bookings.length) * 100) : 0;

    return {
      revenue: totalRevenue,
      packages: myPackages.length,
      bookings: bookings.length,
      conversionRate,
    };
  }, [myPackages, bookings]);

  const revenueData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      months.push({
        key,
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: 0,
      });
    }

    bookings.forEach((booking) => {
      const date = new Date(booking.travelDate || Date.now());
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = months.find((item) => item.key === key);
      if (bucket) {
        bucket.revenue += Number(booking.totalAmount || 0);
      }
    });

    return months;
  }, [bookings]);

  const packagePerformance = useMemo(() => {
    const ranked = myPackages
      .map((pkg) => {
        const count = bookings.filter((booking) => booking.package?.id === pkg.id).length;
        return {
          name: pkg.title,
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    const total = ranked.reduce((sum, item) => sum + item.value, 0);
    if (!total) {
      return [
        { name: 'Starter Packages', value: 40 },
        { name: 'Adventure', value: 25 },
        { name: 'Leisure', value: 20 },
        { name: 'Premium', value: 15 },
      ];
    }

    return ranked.map((item) => ({
      ...item,
      value: Math.round((item.value / total) * 100),
    }));
  }, [myPackages, bookings]);

  const topPackages = useMemo(() => {
    return myPackages
      .map((pkg) => {
        const pkgBookings = bookings.filter((booking) => booking.package?.id === pkg.id);
        const revenue = pkgBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);

        return {
          id: pkg.id,
          name: pkg.title,
          destination: pkg.destination,
          bookings: pkgBookings.length,
          revenue,
          rating: 4.8,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [myPackages, bookings]);

  const recentBookings = useMemo(() => bookings.slice(0, 4), [bookings]);

  if (loading) {
    return <div className="p-8 text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'Agent'}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your travel packages today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatINR(stats.revenue)}
          change="18.2%"
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Active Packages"
          value={String(stats.packages)}
          change="12%"
          icon={Package}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total Bookings"
          value={String(stats.bookings)}
          change="8.5%"
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          change="3.2%"
          icon={TrendingUp}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
              <p className="text-sm text-gray-600">Monthly performance</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 7 months</option>
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip formatter={(value) => [formatINR(value), 'Revenue']} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Package Categories</h2>
          <p className="text-sm text-gray-600 mb-6">Distribution by type</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={packagePerformance}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {packagePerformance.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {packagePerformance.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Top Performing Packages</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {topPackages.length === 0 ? (
              <p className="text-sm text-gray-500">No package performance data yet.</p>
            ) : (
              topPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{pkg.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {pkg.destination}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {pkg.rating}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatINR(pkg.revenue)}</p>
                    <p className="text-sm text-gray-600">{pkg.bookings} bookings</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-gray-500">No bookings yet.</p>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {booking.customer?.name || booking.customer?.email || 'Customer'}
                    </h3>
                    <p className="text-sm text-gray-600">{booking.package?.title || 'Package'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(booking.travelDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatINR(booking.totalAmount)}</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

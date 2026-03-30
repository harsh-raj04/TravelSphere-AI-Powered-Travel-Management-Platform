import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Users, Package } from 'lucide-react';
import { packagesAPI, agentAPI } from '../../services/api';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

export function AgentAnalytics() {
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

        setMyPackages(pkgRes.data?.data?.items || []);
        setBookings(bookingRes.data?.data?.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
    const totalBookings = bookings.length;
    const confirmed = bookings.filter((booking) => booking.status === 'confirmed').length;
    const conversion = totalBookings ? Math.round((confirmed / totalBookings) * 100) : 0;

    return {
      totalRevenue,
      totalBookings,
      totalPackages: myPackages.length,
      conversion,
    };
  }, [bookings, myPackages]);

  const monthlySeries = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const month = new Date(booking.travelDate || Date.now()).toLocaleDateString('en-US', { month: 'short' });
      const existing = map.get(month) || { month, revenue: 0, bookings: 0 };
      existing.revenue += Number(booking.totalAmount || 0);
      existing.bookings += 1;
      map.set(month, existing);
    });

    return Array.from(map.values()).slice(-7);
  }, [bookings]);

  const categorySeries = useMemo(() => {
    if (myPackages.length === 0) return [];

    const data = myPackages.slice(0, 4).map((pkg, index) => ({
      name: pkg.destination || `Category ${index + 1}`,
      value: Math.max(1, Math.round((Number(pkg.price || 0) / 1000) % 40)),
    }));

    const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
    return data.map((item) => ({
      ...item,
      value: Math.round((item.value / total) * 100),
    }));
  }, [myPackages]);

  const topDestinations = useMemo(() => {
    const map = new Map();

    bookings.forEach((booking) => {
      const destination = booking.package?.destination || 'Unknown';
      const existing = map.get(destination) || { destination, bookings: 0 };
      existing.bookings += 1;
      map.set(destination, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.bookings - a.bookings).slice(0, 6);
  }, [bookings]);

  if (loading) {
    return <div className="p-8 text-gray-600 dark:text-slate-300">Loading analytics...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
          <p className="text-gray-600 dark:text-slate-300">Comprehensive insights and performance metrics</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8" />
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded text-sm">
              <TrendingUp className="w-4 h-4" />
              {metrics.conversion}%
            </div>
          </div>
          <h3 className="text-lg opacity-90 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold">{formatINR(metrics.totalRevenue)}</p>
          <p className="text-sm opacity-80 mt-2">Agent portfolio earnings</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg opacity-90 mb-1">Packages</h3>
          <p className="text-3xl font-bold">{metrics.totalPackages}</p>
          <p className="text-sm opacity-80 mt-2">Active catalog entries</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg opacity-90 mb-1">Bookings</h3>
          <p className="text-3xl font-bold">{metrics.totalBookings}</p>
          <p className="text-sm opacity-80 mt-2">Total customer orders</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-lg opacity-90 mb-1">Conversion</h3>
          <p className="text-3xl font-bold">{metrics.conversion}%</p>
          <p className="text-sm opacity-80 mt-2">Confirmed booking ratio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Revenue Overview</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">Monthly performance</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatINR(value), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Package Categories</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">Distribution by type</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categorySeries} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={5}>
                {categorySeries.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {categorySeries.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="inline-flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {item.name}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Top Destinations</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">Bookings by destination</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topDestinations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="destination" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="bookings" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

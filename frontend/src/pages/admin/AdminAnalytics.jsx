import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, IndianRupee, Calendar, Users } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { adminAPI } from '../../services/api';

export function AdminAnalytics() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.analyticsOverview();
        setOverview(res.data?.data || null);
      } catch {
        setOverview(null);
      }
    })();
  }, []);

  const revenueData = useMemo(
    () =>
      (overview?.revenue_trend || []).map((item) => ({
        month: new Date(item.date).toLocaleDateString('en-IN', { month: 'short' }),
        revenue: Number(item.revenue || 0),
      })),
    [overview]
  );

  const bookingData = useMemo(
    () =>
      (overview?.booking_trend || []).map((item) => ({
        month: new Date(item.date).toLocaleDateString('en-IN', { month: 'short' }),
        bookings: Number(item.count || 0),
      })),
    [overview]
  );

  const revenueBreakdown = [
    { name: 'Confirmed', value: overview?.booking_status_breakdown?.confirmed || 0, color: '#10B981' },
    { name: 'Pending', value: overview?.booking_status_breakdown?.pending || 0, color: '#F59E0B' },
    { name: 'Cancelled', value: overview?.booking_status_breakdown?.cancelled || 0, color: '#EF4444' },
  ];

  const topAgents = overview?.top_agents || [];
  const topPackages = overview?.top_packages || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Advanced insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white"><IndianRupee className="w-8 h-8 mb-3 opacity-80" /><p className="text-sm opacity-90 mb-1">Total Revenue</p><p className="text-3xl font-semibold">₹{Number(overview?.total_revenue || 0).toLocaleString('en-IN')}</p></div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white"><Calendar className="w-8 h-8 mb-3 opacity-80" /><p className="text-sm opacity-90 mb-1">Total Bookings</p><p className="text-3xl font-semibold">{overview?.total_bookings || 0}</p></div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white"><Users className="w-8 h-8 mb-3 opacity-80" /><p className="text-sm opacity-90 mb-1">Active Agents</p><p className="text-3xl font-semibold">{topAgents.length}</p></div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white"><TrendingUp className="w-8 h-8 mb-3 opacity-80" /><p className="text-sm opacity-90 mb-1">Payment Success</p><p className="text-3xl font-semibold">{overview?.payment_success_rate || 0}%</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={revenueBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                {revenueBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Agents</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topAgents.map((a) => ({ name: a.agent_name, bookings: a.total_bookings }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Packages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPackages.map((p) => ({ name: p.package_title, bookings: p.total_bookings }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bookingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip />
            <Bar dataKey="bookings" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

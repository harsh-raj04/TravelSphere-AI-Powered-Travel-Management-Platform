import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  IndianRupee,
  Package,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { adminAPI } from '../../services/api';

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

function StatCard({ title, value, icon: Icon, tone }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">{title}</p>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [overviewRes, bookingsRes] = await Promise.all([
          adminAPI.analyticsOverview(),
          adminAPI.bookings({ page: 1, limit: 10 }),
        ]);

        setOverview(overviewRes.data?.data || null);
        setBookings(bookingsRes.data?.data?.items || []);
      } catch {
        setOverview(null);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trendData = useMemo(() => {
    const trend = overview?.booking_trend || [];
    return trend.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      count: item.count,
    }));
  }, [overview]);

  const topAgents = overview?.top_agents || [];
  const topPackages = overview?.top_packages || [];
  const bookingStatusBreakdown = overview?.booking_status_breakdown || {};
  const transactionStatusBreakdown = overview?.transaction_status_breakdown || {};

  const bookingStatusChartData = [
    { label: 'Pending', value: bookingStatusBreakdown.pending || 0 },
    { label: 'Confirmed', value: bookingStatusBreakdown.confirmed || 0 },
    { label: 'Cancelled', value: bookingStatusBreakdown.cancelled || 0 },
  ];

  const paymentSuccessRate = overview?.payment_success_rate || 0;

  if (loading) {
    return <div className="text-gray-600">Loading admin overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600">Cross-platform visibility for bookings, revenue, and top performers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={String(overview?.total_bookings || 0)}
          icon={BarChart3}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Total Revenue"
          value={formatINR(overview?.total_revenue || 0)}
          icon={IndianRupee}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Active Packages"
          value={String(overview?.active_packages || 0)}
          icon={Package}
          tone="bg-violet-50 text-violet-700"
        />
        <StatCard
          title="Active Agents"
          value={String(topAgents.length)}
          icon={Users}
          tone="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Confirmed Bookings"
          value={String(bookingStatusBreakdown.confirmed || 0)}
          icon={CheckCircle2}
          tone="bg-teal-50 text-teal-700"
        />
        <StatCard
          title="Payment Success"
          value={`${paymentSuccessRate}%`}
          icon={Wallet}
          tone="bg-cyan-50 text-cyan-700"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Booking Trend</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#111827" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Agents</h3>
          <ul className="space-y-3">
            {topAgents.length === 0 && <li className="text-sm text-gray-500">No agent data available.</li>}
            {topAgents.map((agent) => (
              <li key={agent.agent_id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{agent.agent_name}</span>
                <span className="text-sm font-semibold text-gray-900">{agent.total_bookings}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Booking Status Mix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingStatusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Transaction Status</h3>
          <ul className="space-y-3">
            <li className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Initiated</span>
              <span className="font-semibold text-gray-900">{transactionStatusBreakdown.initiated || 0}</span>
            </li>
            <li className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Success</span>
              <span className="font-semibold text-emerald-700">{transactionStatusBreakdown.success || 0}</span>
            </li>
            <li className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Failed</span>
              <span className="font-semibold text-rose-700">{transactionStatusBreakdown.failed || 0}</span>
            </li>
            <li className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Refunded</span>
              <span className="font-semibold text-amber-700">{transactionStatusBreakdown.refunded || 0}</span>
            </li>
            <li className="flex items-center justify-between text-sm border-t border-gray-200 pt-3">
              <span className="text-gray-600">No Transaction</span>
              <span className="font-semibold text-gray-900">{transactionStatusBreakdown.no_transaction || 0}</span>
            </li>
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Packages</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topPackages.map((pkg) => ({
                  name: pkg.package_title.length > 16 ? `${pkg.package_title.slice(0, 16)}...` : pkg.package_title,
                  bookings: pkg.total_bookings,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#111827" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {bookings.length === 0 && <p className="text-sm text-gray-500">No bookings found.</p>}
            {bookings.slice(0, 6).map((booking) => (
              <article key={booking.id} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-900">{booking.package?.title}</p>
                <p className="text-xs text-gray-600">
                  {booking.customer?.name || booking.customer?.email} • {booking.package?.agent?.user?.name || 'N/A'}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{new Date(booking.bookingDate).toLocaleDateString('en-IN')}</span>
                  <span className="font-semibold text-gray-900">{formatINR(booking.totalAmount)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

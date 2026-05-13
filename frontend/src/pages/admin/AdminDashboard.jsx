import { useEffect, useMemo, useState, useContext } from 'react';
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Award,
  MapPin,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { KPICard } from '../../components/admin/KPICard';
import { BookingEventContext } from '../../contexts/BookingEventContext';
import { adminAPI } from '../../services/api';

const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

// Static chart data
const svgChartData = [
  { month: 'Dec', revenue: 180000, bookings: 24 },
  { month: 'Jan', revenue: 240000, bookings: 31 },
  { month: 'Feb', revenue: 195000, bookings: 26 },
  { month: 'Mar', revenue: 320000, bookings: 42 },
  { month: 'Apr', revenue: 280000, bookings: 37 },
  { month: 'May', revenue: 410000, bookings: 54 },
];

// Static top packages data
const topPackagesStatic = [
  { name: 'Kashmir Grand Tour', bookings: 47 },
  { name: 'Kerala Wellness Retreat', bookings: 38 },
  { name: 'Rajasthan Royal Tour', bookings: 31 },
  { name: 'Manali Snow Adventure', bookings: 28 },
  { name: 'Goa Beach Paradise', bookings: 24 },
];

function InsightCard({ gradient, icon: Icon, label, title, sub }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white`}>
      <div className="opacity-80 mb-3">
        <Icon size={30} />
      </div>
      <p className="text-sm opacity-90 mb-1">{label}</p>
      <p className="text-xl font-semibold mb-1 leading-tight">{title}</p>
      <p className="text-sm opacity-80">{sub}</p>
    </div>
  );
}

function DualLineChart({ data }) {
  const w = 600, h = 260;
  const pad = { t: 20, b: 36, l: 40, r: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const stepX = innerW / (data.length - 1);
  const maxRev = Math.max(...data.map(d => d.revenue));
  const maxBook = Math.max(...data.map(d => d.bookings));
  const revPts = data.map((d, i) => ({ x: pad.l + i * stepX, y: pad.t + innerH - (d.revenue / maxRev) * innerH, ...d }));
  const bookPts = data.map((d, i) => ({ x: pad.l + i * stepX, y: pad.t + innerH - (d.bookings / maxBook) * innerH, ...d }));
  const makePath = pts => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revenue & Bookings</h3>
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-blue-500 inline-block" />
            Bookings
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-64">
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={pad.l} x2={w - pad.r} y1={pad.t + innerH * t} y2={pad.t + innerH * t} stroke="#E5E7EB" strokeDasharray="4 4" />
        ))}
        <path d={makePath(revPts)} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={makePath(bookPts)} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {revPts.map((p, i) => (
          <circle key={`r${i}`} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#10B981" strokeWidth="2" />
        ))}
        {bookPts.map((p, i) => (
          <circle key={`b${i}`} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#3B82F6" strokeWidth="2" />
        ))}
        {data.map((d, i) => (
          <text key={i} x={pad.l + i * stepX} y={h - 12} textAnchor="middle" fontSize="11" fill="#6B7280">{d.month}</text>
        ))}
      </svg>
    </div>
  );
}

function TopPackagesBar({ data }) {
  const max = Math.max(...data.map(d => d.bookings));
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Top Packages</h3>
      <div className="space-y-3">
        {data.map(d => (
          <div key={d.name}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.name}</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">{d.bookings}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(d.bookings / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { on } = useContext(BookingEventContext);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log('[AdminDashboard] Fetching data...');
      try {
        const [overviewRes, bookingsRes] = await Promise.all([
          adminAPI.analyticsOverview(),
          adminAPI.bookings({ page: 1, limit: 8 }),
        ]);
        console.log('[AdminDashboard] Got data');
        setOverview(overviewRes.data?.data || null);
        setBookings(bookingsRes.data?.data?.items || []);
      } catch (err) {
        console.error('[AdminDashboard] Error fetching:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const unsubscribeCreated = on('booking:created', () => {
      console.log('[AdminDashboard] booking:created event - refetching');
      fetchData();
    });

    const unsubscribeCancelled = on('booking:cancelled', () => {
      console.log('[AdminDashboard] booking:cancelled event - refetching');
      fetchData();
    });

    const unsubscribeCompleted = on('booking:completed', () => {
      console.log('[AdminDashboard] booking:completed event - refetching');
      fetchData();
    });

    const unsubscribePaymentCompleted = on('payment:completed', () => {
      console.log('[AdminDashboard] payment:completed event - refetching');
      fetchData();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeCancelled();
      unsubscribeCompleted();
      unsubscribePaymentCompleted();
    };
  }, [on]);

  const totalRevenue = Number(overview?.total_revenue || 0);
  const totalPayout = Number(overview?.total_agent_payout || 0);
  const totalMargin = Number(overview?.total_admin_margin || 0);
  const totalBookings = Number(overview?.total_bookings || 0);
  const topAgent = (overview?.top_agents || [])[0];
  const mostBooked = (overview?.top_packages || [])[0];

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Row 0: Insight gradient cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          gradient="from-blue-500 to-cyan-500"
          icon={TrendingUp}
          label="This month"
          title="₹4.2L revenue"
          sub="+18% vs last month"
        />
        <InsightCard
          gradient="from-emerald-500 to-teal-500"
          icon={Users}
          label="Active agents"
          title="24 agents online"
          sub="3 new this week"
        />
        <InsightCard
          gradient="from-amber-500 to-orange-500"
          icon={AlertCircle}
          label="Needs attention"
          title="7 pending payouts"
          sub="₹82,000 total"
        />
      </div>

      {/* Row 1: KPI stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Revenue" value={formatINR(totalRevenue)} icon={DollarSign} iconColor="text-emerald-500" trend={{ value: 12.5, isPositive: true }} />
        <KPICard title="Agent Payouts" value={formatINR(totalPayout)} icon={Users} iconColor="text-blue-500" trend={{ value: 8.2, isPositive: true }} />
        <KPICard title="Admin Margin" value={formatINR(totalMargin)} icon={TrendingUp} iconColor="text-purple-500" trend={{ value: 0, isPositive: true }} />
        <KPICard title="Total Bookings" value={totalBookings} icon={Calendar} iconColor="text-amber-500" trend={{ value: 3.8, isPositive: true }} />
      </div>

      {/* Row 2: SVG Dual Line Chart + Top Packages Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DualLineChart data={svgChartData} />
        </div>
        <div className="lg:col-span-1">
          <TopPackagesBar data={topPackagesStatic} />
        </div>
      </div>

      {/* Row 3: Quick insights + recent bookings */}
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

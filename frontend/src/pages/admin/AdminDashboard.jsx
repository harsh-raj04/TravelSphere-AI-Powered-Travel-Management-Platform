import { useEffect, useMemo, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CHART_PERIODS = [
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'year', label: 'Year', days: 365 },
];

function buildAdminChartData(revenueTrend, bookingTrend, period) {
  const revMap = new Map();
  const bookMap = new Map();
  for (const e of (revenueTrend || [])) revMap.set(e.date, e.revenue);
  for (const e of (bookingTrend || [])) bookMap.set(e.date, e.count);

  if (period === 'year') {
    // Group by month — last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      let rev = 0, books = 0;
      for (const [date, r] of revMap) { if (date.startsWith(key)) rev += r; }
      for (const [date, b] of bookMap) { if (date.startsWith(key)) books += b; }
      months.push({
        month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: rev,
        bookings: books,
      });
    }
    return months;
  }

  const numDays = period === 'week' ? 7 : 30;
  const days = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      month: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: revMap.get(key) || 0,
      bookings: bookMap.get(key) || 0,
    });
  }
  return days;
}

function DualLineChart({ revenueTrend, bookingTrend }) {
  const [period, setPeriod] = useState('month');

  const data = useMemo(
    () => buildAdminChartData(revenueTrend, bookingTrend, period),
    [revenueTrend, bookingTrend, period],
  );

  const w = 600, h = 260;
  const pad = { t: 20, b: 36, l: 40, r: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const maxBook = Math.max(...data.map(d => d.bookings), 1);
  const revPts = data.map((d, i) => ({ x: pad.l + i * stepX, y: pad.t + innerH - (d.revenue / maxRev) * innerH, ...d }));
  const bookPts = data.map((d, i) => ({ x: pad.l + i * stepX, y: pad.t + innerH - (d.bookings / maxBook) * innerH, ...d }));
  const makePath = pts => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revenue & Bookings</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
            {CHART_PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 font-medium transition-colors ${period === p.key ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
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

function TopPackagesBar({ data, onPackageClick }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Top Packages</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">No bookings yet.</p>
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.bookings));
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Top Packages</h3>
      <div className="space-y-3">
        {data.map(d => (
          <div
            key={d.id || d.name}
            onClick={() => onPackageClick && d.id && onPackageClick(d.id)}
            className={onPackageClick && d.id ? 'cursor-pointer group' : ''}
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className={`text-sm font-medium truncate ${onPackageClick && d.id ? 'text-blue-600 dark:text-blue-400 group-hover:underline' : 'text-gray-900 dark:text-white'}`}>
                {d.name}
              </span>
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
  const navigate = useNavigate();
  const { on } = useContext(BookingEventContext);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [withdrawalData, setWithdrawalData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, bookingsRes, agentsRes, withdrawalsRes] = await Promise.all([
        adminAPI.analyticsOverview(),
        adminAPI.bookings({ page: 1, limit: 8 }),
        adminAPI.agents(),
        adminAPI.getWithdrawals({ status: 'pending' }),
      ]);
      setOverview(overviewRes.data?.data || null);
      setBookings(bookingsRes.data?.data?.items || []);
      setAgents(agentsRes.data?.data?.items || []);
      setWithdrawalData(withdrawalsRes.data?.data || null);
    } catch (err) {
      console.error('[AdminDashboard] Error fetching:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const unsubscribeCreated = on('booking:created', fetchData);
    const unsubscribeCancelled = on('booking:cancelled', fetchData);
    const unsubscribeCompleted = on('booking:completed', fetchData);
    const unsubscribePaymentCompleted = on('payment:completed', fetchData);

    return () => {
      unsubscribeCreated();
      unsubscribeCancelled();
      unsubscribeCompleted();
      unsubscribePaymentCompleted();
    };
  }, [on, fetchData]);

  const totalRevenue = Number(overview?.total_revenue || 0);
  const totalPayout = Number(overview?.total_agent_payout || 0);
  const totalMargin = Number(overview?.total_admin_margin || 0);
  const totalBookings = Number(overview?.total_bookings || 0);
  const topAgent = (overview?.top_agents || [])[0];
  const mostBooked = (overview?.top_packages || [])[0];

  // Insight card: this month vs last month revenue
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const lastMonthKey = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);
  const thisMonthRevenue = (overview?.revenue_trend || []).filter(e => e.date?.startsWith(thisMonthKey)).reduce((s, e) => s + e.revenue, 0);
  const lastMonthRevenue = (overview?.revenue_trend || []).filter(e => e.date?.startsWith(lastMonthKey)).reduce((s, e) => s + e.revenue, 0);
  const revenueChangePct = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;
  const thisMonthLabel = thisMonthRevenue >= 100000
    ? `₹${(thisMonthRevenue / 100000).toFixed(1)}L`
    : formatINR(thisMonthRevenue);

  // Insight card: agent counts
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeAgentCount = agents.filter(a => a.status === 'active').length;
  const newThisWeek = agents.filter(a => new Date(a.joined_date) > weekAgo).length;

  // Insight card: pending payouts
  const pendingPayoutCount = withdrawalData?.counts?.pending || 0;
  const pendingPayoutTotal = withdrawalData?.summary?.pending || 0;
  const pendingTotalLabel = pendingPayoutTotal >= 100000
    ? `₹${(pendingPayoutTotal / 100000).toFixed(1)}L total`
    : `${formatINR(pendingPayoutTotal)} total`;


  // Real top packages
  const topPackagesData = (overview?.top_packages || []).map(p => ({
    id: p.package_id,
    name: p.package_title,
    bookings: p.total_bookings,
  }));

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
          title={`${thisMonthLabel} revenue`}
          sub={revenueChangePct >= 0 ? `+${revenueChangePct}% vs last month` : `${revenueChangePct}% vs last month`}
        />
        <InsightCard
          gradient="from-emerald-500 to-teal-500"
          icon={Users}
          label="Active agents"
          title={`${activeAgentCount} agent${activeAgentCount !== 1 ? 's' : ''} active`}
          sub={newThisWeek > 0 ? `${newThisWeek} new this week` : 'No new agents this week'}
        />
        <InsightCard
          gradient="from-amber-500 to-orange-500"
          icon={AlertCircle}
          label="Needs attention"
          title={`${pendingPayoutCount} pending payout${pendingPayoutCount !== 1 ? 's' : ''}`}
          sub={pendingPayoutCount > 0 ? pendingTotalLabel : 'No pending payouts'}
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
          <DualLineChart revenueTrend={overview?.revenue_trend} bookingTrend={overview?.booking_trend} />
        </div>
        <div className="lg:col-span-1">
          <TopPackagesBar data={topPackagesData} onPackageClick={(id) => navigate(`/admin/packages/${id}`)} />
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    booking.status === 'pending'         ? 'bg-amber-100 text-amber-700' :
                    booking.status === 'confirmed'       ? 'bg-blue-100 text-blue-700' :
                    booking.status === 'open_for_agents' ? 'bg-violet-100 text-violet-700' :
                    booking.status === 'assigned'        ? 'bg-blue-100 text-blue-700' :
                    booking.status === 'accepted'        ? 'bg-cyan-100 text-cyan-700' :
                    booking.status === 'in_progress'     ? 'bg-indigo-100 text-indigo-700' :
                    booking.status === 'completed'       ? 'bg-emerald-100 text-emerald-700' :
                    booking.status === 'closed'          ? 'bg-gray-100 text-gray-600' :
                    booking.status === 'cancelled'       ? 'bg-red-100 text-red-700' :
                    booking.status === 'rejected'        ? 'bg-rose-100 text-rose-700' :
                                                          'bg-gray-100 text-gray-600'
                  }`}>
                    {booking.status.replace(/_/g, ' ')}
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

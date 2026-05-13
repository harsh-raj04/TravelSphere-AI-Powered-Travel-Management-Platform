import { useEffect, useMemo, useState, useContext } from 'react';
import {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  MapPin,
  Star,
  ArrowUpRight,
  CheckCircle,
  CreditCard,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BookingEventContext } from '../../contexts/BookingEventContext';
import { packagesAPI, agentAPI } from '../../services/api';
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

function StatCard({ title, value, change, icon: Icon, iconGradient }) {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-teal-100/60 dark:border-dark-border hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-0.5 transition-all duration-300 cursor-default">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-1">{title}</p>
          <h3 className="text-4xl leading-none font-bold text-gray-900 dark:text-dark-text-primary mb-3">{value}</h3>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-green-600">↑ {change}</span>
            <span className="text-sm text-gray-500 dark:text-dark-text-secondary">vs last month</span>
          </div>
        </div>
        <div className={`bg-gradient-to-br ${iconGradient} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Static chart data for visual display
const chartData = [
  { label: 'Dec', value: 85000 },
  { label: 'Jan', value: 120000 },
  { label: 'Feb', value: 95000 },
  { label: 'Mar', value: 180000 },
  { label: 'Apr', value: 145000 },
  { label: 'May', value: 210000 },
];

// Static activity feed data
const activityItems = [
  {
    text: 'New booking confirmed — Kashmir Grand Tour',
    time: '2 hours ago',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    Icon: CheckCircle,
  },
  {
    text: 'Payment received — ₹45,000',
    time: '5 hours ago',
    bg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    Icon: CreditCard,
  },
  {
    text: 'Customer query from Priya Sharma',
    time: '1 day ago',
    bg: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    Icon: MessageSquare,
  },
  {
    text: 'Booking cancelled — Goa Beach Paradise',
    time: '2 days ago',
    bg: 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
    Icon: XCircle,
  },
];

function RevenueChart({ data }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const width = 600, height = 220;
  const pad = { top: 20, bottom: 30, left: 30, right: 10 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const stepX = innerW / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + innerH - ((d.value - min) / (max - min || 1)) * innerH,
    ...d,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.top + innerH} L ${pts[0].x} ${pad.top + innerH} Z`;

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-teal-100/60 dark:border-dark-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#022C22] dark:text-dark-text-primary">Revenue trend</h3>
          <p className="text-xs text-teal-700/60 mt-0.5">Last 6 months · in ₹</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        <defs>
          <linearGradient id="rev-grad-agent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={pad.left} x2={width - pad.right}
            y1={pad.top + innerH * t} y2={pad.top + innerH * t}
            stroke="#CCFBF1" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#rev-grad-agent)" />
        <path d={linePath} fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#0F766E" strokeWidth="2" />
        ))}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize="11" fill="#0D6E63">{p.label}</text>
        ))}
      </svg>
    </div>
  );
}

function ActivityFeed({ items }) {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-teal-100/60 dark:border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#022C22] dark:text-dark-text-primary">Recent Activity</h3>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => {
          const Icon = it.Icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${it.bg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-[#022C22] dark:text-dark-text-primary leading-snug">{it.text}</p>
                <p className="text-xs text-teal-700/60 mt-0.5">{it.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AgentDashboard() {
  const { user } = useAuth();
  const { on } = useContext(BookingEventContext);
  const [loading, setLoading] = useState(true);
  const [myPackages, setMyPackages] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      console.log('[AgentDashboard] Fetching data...');
      try {
        const [pkgRes, bookingRes] = await Promise.all([
          packagesAPI.list({ page: 1, limit: 100 }),
          agentAPI.bookings(),
        ]);

        const allPackages = pkgRes.data?.data?.items || [];
        const mine = allPackages.filter((pkg) => pkg.agent?.user?.id === user?.id);

        console.log('[AgentDashboard] Got data - packages:', mine.length, 'bookings:', bookingRes.data?.data?.items?.length);
        setMyPackages(mine);
        setBookings(bookingRes.data?.data?.items || []);
      } catch (err) {
        console.error('[AgentDashboard] Error fetching:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const unsubscribeCreated = on('booking:created', () => {
      console.log('[AgentDashboard] booking:created event - refetching');
      fetchData();
    });

    const unsubscribeCancelled = on('booking:cancelled', () => {
      console.log('[AgentDashboard] booking:cancelled event - refetching');
      fetchData();
    });

    const unsubscribeCompleted = on('booking:completed', () => {
      console.log('[AgentDashboard] booking:completed event - refetching');
      fetchData();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeCancelled();
      unsubscribeCompleted();
    };
  }, [user?.id, on]);

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

  const recentBookings = useMemo(() => bookings.slice(0, 6), [bookings]);

  if (loading) {
    return <div className="p-8 text-gray-600 dark:text-dark-text-secondary">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2 tracking-tight">
          Welcome back, {user?.name || 'Agent'}!
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Here's what's happening with your travel packages today
        </p>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatINR(stats.revenue)}
          change="18.2%"
          icon={DollarSign}
          iconGradient="from-green-500 to-emerald-600"
        />
        <StatCard
          title="Active Packages"
          value={String(stats.packages)}
          change="12%"
          icon={Package}
          iconGradient="from-blue-500 to-indigo-600"
        />
        <StatCard
          title="Total Bookings"
          value={String(stats.bookings)}
          change="8.5%"
          icon={Users}
          iconGradient="from-purple-500 to-violet-600"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          change="3.2%"
          icon={TrendingUp}
          iconGradient="from-orange-500 to-amber-600"
        />
      </div>

      {/* Row 2: Revenue Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed items={activityItems} />
        </div>
      </div>

      {/* Row 3: Recent Bookings (full width) */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-teal-100/60 dark:border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">Recent Bookings</h2>
          <a href="/agent/bookings" className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
            View all
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        <div className="space-y-3">
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">No bookings yet.</p>
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border border-teal-100/60 dark:border-dark-border rounded-xl hover:bg-teal-50/30 dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                    {booking.customer?.name || booking.customer?.email || 'Customer'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{booking.package?.title || 'Package'}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
                    {new Date(booking.travelDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-dark-text-primary">{formatINR(booking.totalAmount)}</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
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
  );
}

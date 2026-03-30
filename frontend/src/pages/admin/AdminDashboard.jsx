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
import { revenueData, packagePopularityData, agentPerformanceData, mockBookings } from './mockData';

export function AdminDashboard() {
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = mockBookings.length;
  const activeAgents = 3;
  const conversionRate = 68.5;

  const recentBookings = mockBookings.slice(0, 5);
  const topAgent = agentPerformanceData[0];
  const mostBooked = packagePopularityData[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Revenue" value={`₹${(totalRevenue / 100000).toFixed(1)}L`} icon={DollarSign} iconColor="text-emerald-500" trend={{ value: 12.5, isPositive: true }} />
        <KPICard title="Total Bookings" value={totalBookings} icon={Calendar} iconColor="text-blue-500" trend={{ value: 8.2, isPositive: true }} />
        <KPICard title="Active Agents" value={activeAgents} icon={Users} iconColor="text-purple-500" trend={{ value: 0, isPositive: true }} />
        <KPICard title="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} iconColor="text-amber-500" trend={{ value: 3.8, isPositive: true }} />
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
              <YAxis dataKey="name" type="category" stroke="#6B7280" style={{ fontSize: '12px' }} width={100} />
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
            <p className="text-xl font-semibold mb-1">{topAgent.name}</p>
            <p className="text-sm opacity-80">{topAgent.bookings} bookings | ₹{topAgent.revenue.toLocaleString('en-IN')} revenue</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white">
            <MapPin className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Most Booked Destination</p>
            <p className="text-xl font-semibold mb-1">{mostBooked.name}</p>
            <p className="text-sm opacity-80">{mostBooked.bookings} total bookings</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white">
            <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Needs Attention</p>
            <p className="text-xl font-semibold mb-1">3 Unassigned Bookings</p>
            <p className="text-sm opacity-80">Action required</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
            <a href="/admin/bookings" className="text-sm text-blue-500 hover:text-blue-600 font-medium">View all →</a>
          </div>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{booking.customerName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{booking.packageName}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-semibold text-gray-900 dark:text-white">₹{booking.amount.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{booking.date}</p>
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

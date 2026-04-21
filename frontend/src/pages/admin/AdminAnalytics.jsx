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
import { revenueData, packagePopularityData, agentPerformanceData } from './mockData';

export function AdminAnalytics() {
  const revenueBreakdown = [
    { name: 'Confirmed', value: 450000, color: '#10B981' },
    { name: 'Pending', value: 125000, color: '#F59E0B' },
    { name: 'Completed', value: 380000, color: '#3B82F6' },
  ];

  const monthlyComparison = [
    { month: 'Jan', thisYear: 156000, lastYear: 142000 },
    { month: 'Feb', thisYear: 189000, lastYear: 165000 },
    { month: 'Mar', thisYear: 212000, lastYear: 178000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Advanced insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white"><IndianRupee className="w-8 h-8 mb-3 opacity-80" /><p className="text-sm opacity-90 mb-1">Total Revenue (6M)</p><p className="text-3xl font-semibold">₹10.1L</p><p className="text-sm mt-2 opacity-90">↑ 18.2% from last period</p></div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white"><Calendar className="w-8 h-8 mb-3 opacity-80" /><p className="text-sm opacity-90 mb-1">Total Bookings</p><p className="text-3xl font-semibold">340</p><p className="text-sm mt-2 opacity-90">↑ 12.5% from last period</p></div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white"><Users className="w-8 h-8 mb-3 opacity-80" /><p className="text-sm opacity-90 mb-1">Active Agents</p><p className="text-3xl font-semibold">3</p><p className="text-sm mt-2 opacity-90">Performing above 4.5★</p></div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white"><TrendingUp className="w-8 h-8 mb-3 opacity-80" /><p className="text-sm opacity-90 mb-1">Conversion Rate</p><p className="text-3xl font-semibold">68.5%</p><p className="text-sm mt-2 opacity-90">↑ 4.3% from last period</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend (6 Months)</h3><ResponsiveContainer width="100%" height={300}><LineChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} /><XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} /><YAxis stroke="#6B7280" style={{ fontSize: '12px' }} /><Tooltip /><Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Breakdown</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={revenueBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">{revenueBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agent Performance Comparison</h3><ResponsiveContainer width="100%" height={300}><BarChart data={agentPerformanceData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} /><XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} /><YAxis yAxisId="left" orientation="left" stroke="#10B981" style={{ fontSize: '12px' }} /><YAxis yAxisId="right" orientation="right" stroke="#3B82F6" style={{ fontSize: '12px' }} /><Tooltip /><Legend /><Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Revenue (₹)" radius={[8, 8, 0, 0]} /><Bar yAxisId="right" dataKey="bookings" fill="#3B82F6" name="Bookings" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Popular Packages</h3><ResponsiveContainer width="100%" height={300}><BarChart data={packagePopularityData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} /><XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} /><YAxis stroke="#6B7280" style={{ fontSize: '12px' }} /><Tooltip /><Bar dataKey="bookings" fill="#8B5CF6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Year-over-Year Comparison</h3><ResponsiveContainer width="100%" height={350}><BarChart data={monthlyComparison}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} /><XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} /><YAxis stroke="#6B7280" style={{ fontSize: '12px' }} /><Tooltip /><Legend /><Bar dataKey="thisYear" fill="#3B82F6" name="2026" radius={[8, 8, 0, 0]} /><Bar dataKey="lastYear" fill="#6B7280" name="2025" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </div>
  );
}

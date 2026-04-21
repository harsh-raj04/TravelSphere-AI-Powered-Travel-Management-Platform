import { Link } from 'react-router-dom';
import { Shield, Activity, Users } from 'lucide-react';

export function AdminHome() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <p className="uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 text-xs mb-4">Admin Control</p>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4">Platform Visibility, End-to-End.</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mb-8">Built for admin workflows: bookings, payments, customer oversight, support management, and analytics in one place.</p>
        <div className="flex gap-4">
          <Link to="/admin/login" className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold">Login as Admin</Link>
          <Link to="/admin/dashboard" className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900">Go to Dashboard</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-12">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"><Shield className="w-6 h-6 text-blue-600 mb-3" /><h3 className="font-semibold text-gray-900 dark:text-white mb-1">Governance</h3><p className="text-sm text-gray-600 dark:text-gray-300">Approve and monitor every flow.</p></div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"><Activity className="w-6 h-6 text-blue-600 mb-3" /><h3 className="font-semibold text-gray-900 dark:text-white mb-1">Analytics</h3><p className="text-sm text-gray-600 dark:text-gray-300">Track performance and operations.</p></div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"><Users className="w-6 h-6 text-blue-600 mb-3" /><h3 className="font-semibold text-gray-900 dark:text-white mb-1">User Oversight</h3><p className="text-sm text-gray-600 dark:text-gray-300">Manage customers and agents.</p></div>
        </div>
      </div>
    </div>
  );
}

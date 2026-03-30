import { useEffect, useState } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { StatusBadge } from '../../components/admin/StatusBadge';

export function AdminAgents() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.agents();
        setAgents(res.data?.data?.items || []);
      } catch {
        setAgents([]);
      }
    })();
  }, []);

  const activeAgents = agents.filter((a) => a.status === 'active');
  const pendingAgents = agents.filter((a) => a.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Agent Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor and manage travel agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Agents</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{activeAgents.length}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Approval</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{pendingAgents.length}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{agents.reduce((sum, a) => sum + Number(a.bookings_handled || 0), 0)}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{agents.reduce((sum, a) => sum + Number(a.revenue || 0), 0).toLocaleString('en-IN')}</p></div>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />Top Performing Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeAgents.slice(0, 3).map((agent, index) => (
            <div key={agent.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2"><span className="text-2xl font-bold">#{index + 1}</span><div className="flex-1"><p className="font-semibold">{agent.name}</p><div className="flex items-center gap-1 text-sm opacity-90"><Star className="w-3 h-3 fill-current" />4.8</div></div></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><div><p className="opacity-80">Bookings</p><p className="font-semibold">{agent.bookings_handled}</p></div><div><p className="opacity-80">Revenue</p><p className="font-semibold">₹{Number(agent.revenue || 0).toLocaleString('en-IN')}</p></div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Packages</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <td className="px-6 py-4"><div><p className="font-medium text-gray-900 dark:text-white">{agent.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">ID: {agent.id}</p></div></td>
                  <td className="px-6 py-4"><div className="text-sm"><p className="text-gray-900 dark:text-white">{agent.email}</p><p className="text-gray-500 dark:text-gray-400">{agent.phone || '-'}</p></div></td>
                  <td className="px-6 py-4 text-center"><span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500/10 text-blue-500 rounded-full font-semibold">{agent.packages_count}</span></td>
                  <td className="px-6 py-4 text-center"><span className="font-semibold text-gray-900 dark:text-white">{agent.bookings_handled}</span></td>
                  <td className="px-6 py-4"><span className="font-semibold text-gray-900 dark:text-white">₹{Number(agent.revenue || 0).toLocaleString('en-IN')}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-current" /><span className="font-medium text-gray-900 dark:text-white">4.8</span></div></td>
                  <td className="px-6 py-4"><StatusBadge status={agent.status} variant="small" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

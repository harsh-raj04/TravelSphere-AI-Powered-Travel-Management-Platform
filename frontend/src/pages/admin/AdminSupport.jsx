import { useState } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { mockTickets, mockAgents } from './mockData';
import { StatusBadge } from '../../components/admin/StatusBadge';

export function AdminSupport() {
  const [tickets, setTickets] = useState(mockTickets);
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredTickets = tickets.filter((ticket) => priorityFilter === 'all' || ticket.priority === priorityFilter);

  const handleAssignAgent = (ticketId, agentName) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, assignedTo: agentName } : ticket)));
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket)));
  };

  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'in-progress').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
  const urgentTickets = tickets.filter((t) => t.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Support Tickets</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage customer support requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-amber-500/10 rounded-lg"><MessageSquare className="w-6 h-6 text-amber-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Open Tickets</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{openTickets}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-blue-500/10 rounded-lg"><Clock className="w-6 h-6 text-blue-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{inProgressTickets}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-emerald-500/10 rounded-lg"><CheckCircle className="w-6 h-6 text-emerald-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{resolvedTickets}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-3 bg-red-500/10 rounded-lg"><AlertCircle className="w-6 h-6 text-red-500" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Urgent</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{urgentTickets}</p></div></div></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-4"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by priority:</label><div className="flex gap-2">{['all', 'urgent', 'high', 'medium', 'low'].map((priority) => <button key={priority} onClick={() => setPriorityFilter(priority)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${priorityFilter === priority ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>{priority}</button>)}</div></div></div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"><tr><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ticket ID</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Customer</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Subject</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Priority</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Assigned To</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{filteredTickets.map((ticket) => <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"><td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{ticket.id}</span></td><td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-white" /></div><span className="font-medium text-gray-900 dark:text-white">{ticket.customerName}</span></div></td><td className="px-6 py-4"><p className="text-gray-900 dark:text-white">{ticket.subject}</p></td><td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={ticket.priority} variant="small" /></td><td className="px-6 py-4 whitespace-nowrap"><select value={ticket.status} onChange={(e) => handleStatusChange(ticket.id, e.target.value)} className="px-3 py-1.5 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"><option value="open">Open</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></td><td className="px-6 py-4"><select value={ticket.assignedTo || ''} onChange={(e) => handleAssignAgent(ticket.id, e.target.value)} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Unassigned</option>{mockAgents.filter((a) => a.status === 'active').map((agent) => <option key={agent.id} value={agent.name}>{agent.name}</option>)}</select></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{ticket.createdAt}</td><td className="px-6 py-4 whitespace-nowrap"><button className="text-blue-500 hover:text-blue-600 font-medium text-sm">View</button></td></tr>)}</tbody></table></div>{filteredTickets.length === 0 && <div className="text-center py-12"><p className="text-gray-500 dark:text-gray-400">No tickets found for this filter</p></div>}</div>

      <div className="text-sm text-gray-600 dark:text-gray-400">Showing {filteredTickets.length} of {tickets.length} tickets</div>
    </div>
  );
}

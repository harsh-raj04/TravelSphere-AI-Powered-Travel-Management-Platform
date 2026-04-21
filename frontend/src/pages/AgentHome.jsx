import { Link } from 'react-router-dom';
import { Compass, BarChart3, Layers } from 'lucide-react';

export function AgentHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <p className="uppercase tracking-[0.3em] text-cyan-300 text-xs mb-4">Agent Workspace</p>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">Sell Better. Manage Faster.</h1>
        <p className="text-slate-300 text-lg max-w-2xl mb-8">Dedicated portal for travel agents to create packages, track bookings, and grow revenue with analytics.</p>
        <div className="flex gap-4">
          <Link to="/agent/login" className="px-5 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">Open Agent Login</Link>
          <Link to="/login" className="px-5 py-3 rounded-lg border border-slate-600 hover:border-slate-400">Use Shared Login</Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-12">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5"><Layers className="w-6 h-6 text-cyan-300 mb-3" /><h3 className="font-semibold mb-1">Package Studio</h3><p className="text-sm text-slate-300">Create and manage listings quickly.</p></div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5"><Compass className="w-6 h-6 text-cyan-300 mb-3" /><h3 className="font-semibold mb-1">Booking Control</h3><p className="text-sm text-slate-300">Handle confirmations and status updates.</p></div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5"><BarChart3 className="w-6 h-6 text-cyan-300 mb-3" /><h3 className="font-semibold mb-1">Performance View</h3><p className="text-sm text-slate-300">Track trends and conversion metrics.</p></div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { MessageSquare, Users, TrendingUp, Bot, ExternalLink } from 'lucide-react';
import { aiAPI } from '../../services/api';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? '–'}</p>
      </div>
    </div>
  );
}

const TYPE_LABELS = { 'trip-planner': 'Trip Planner', 'homepage-widget': 'Support Widget' };
const TYPE_COLORS = {
  'trip-planner': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'homepage-widget': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export function AdminAIAnalytics() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.getAnalytics()
      .then((r) => {
        setStats(r.data?.data?.stats);
        setRecent(r.data?.data?.recent || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Conversations via Trip Planner and homepage chatbot widget
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Total Conversations" value={stats?.total} color="bg-teal-500" />
        <StatCard icon={Bot} label="Trip Planner" value={stats?.tripPlanner} color="bg-emerald-500" />
        <StatCard icon={Users} label="Support Widget" value={stats?.widget} color="bg-purple-500" />
        <StatCard icon={TrendingUp} label="Led to Booking" value={stats?.leadToBooking} color="bg-orange-500" />
      </div>

      {/* Recent conversations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Conversations</h2>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">No conversations yet.</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {recent.map((conv) => (
              <div key={conv.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {conv.title || 'Untitled conversation'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[conv.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[conv.type] || conv.type}
                      </span>
                      <span className="text-xs text-gray-400">{conv.messageCount} messages</span>
                      {conv.user && (
                        <span className="text-xs text-gray-400">· {conv.user.name} ({conv.user.email})</span>
                      )}
                      {conv.leadToBooking && (
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                          → Booked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {new Date(conv.lastMessageAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

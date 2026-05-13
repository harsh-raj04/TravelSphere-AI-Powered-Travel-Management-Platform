import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CreditCard,
  MessageSquare,
  Clock,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';
import { agentAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { timeAgo } from '../../components/agent/AgentLayout';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getNotifIcon(type) {
  if (type === 'booking_status_changed' || type === 'agent_assigned') {
    return { icon: Calendar, colorClass: 'text-blue-500', bgClass: 'bg-blue-50' };
  }
  if (type === 'withdrawal_status') {
    return { icon: CreditCard, colorClass: 'text-teal-500', bgClass: 'bg-teal-50' };
  }
  if (type === 'ticket_reply' || type === 'ticket_status_changed' || type === 'ticket_created') {
    return { icon: MessageSquare, colorClass: 'text-purple-500', bgClass: 'bg-purple-50' };
  }
  return { icon: Bell, colorClass: 'text-gray-400', bgClass: 'bg-gray-100' };
}

function matchesFilter(n, filter) {
  if (filter === 'all') return true;
  if (filter === 'unread') return !n.isRead;
  if (filter === 'bookings') return n.type === 'booking_status_changed' || n.type === 'agent_assigned';
  if (filter === 'payments') return n.type === 'withdrawal_status';
  if (filter === 'support') return n.type === 'ticket_reply' || n.type === 'ticket_status_changed' || n.type === 'ticket_created';
  return true;
}

const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'unread',   label: 'Unread' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'payments', label: 'Payments' },
  { id: 'support',  label: 'Support' },
];

const PAGE_SIZE = 20;

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

// ─── AgentNotifications ────────────────────────────────────────────────────────
export function AgentNotifications() {
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const addToast = useToast();
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agentAPI.getNotifications({ limit: 100 });
      setAllNotifications(res.data?.data?.notifications ?? []);
    } catch {
      addToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter]);

  const filtered = allNotifications.filter((n) => matchesFilter(n, filter));
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const allRead = allNotifications.every((n) => n.isRead);
  const unreadTotal = allNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await agentAPI.markAllNotificationsRead();
      setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      addToast('All notifications marked as read', 'success');
    } catch {
      addToast('Failed to mark all as read', 'error');
    }
  };

  const handleCardClick = async (n) => {
    if (!n.isRead) {
      try {
        await agentAPI.markNotificationRead(n.id);
        setAllNotifications((prev) =>
          prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item)
        );
      } catch {
        // ignore
      }
    }
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadTotal > 0 && (
              <p className="text-sm text-gray-500">{unreadTotal} unread</p>
            )}
          </div>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={allRead || loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
        {FILTERS.map((f) => {
          const count = f.id === 'all'
            ? allNotifications.length
            : f.id === 'unread'
            ? allNotifications.filter((n) => !n.isRead).length
            : allNotifications.filter((n) => matchesFilter(n, f.id)).length;

          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === f.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-700">No notifications here</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'unread' ? 'You\'re all caught up!' : 'Nothing in this category yet'}
            </p>
          </div>
        ) : (
          visible.map((n) => {
            const { icon: Icon, colorClass, bgClass } = getNotifIcon(n.type);
            return (
              <div
                key={n.id}
                onClick={() => handleCardClick(n)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${
                  !n.isRead
                    ? 'bg-teal-50/40 border-teal-100 hover:bg-teal-50/70'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                } ${n.actionUrl ? 'hover:shadow-sm' : ''}`}
              >
                <div className={`w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="w-2.5 h-2.5 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Load more */}
      {!loading && hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <ChevronDown className="w-4 h-4" />
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

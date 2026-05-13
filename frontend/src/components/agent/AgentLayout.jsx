import { useEffect, useRef, useState, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Package,
  BarChart3,
  Bell,
  Search,
  User,
  Plane,
  LogOut,
  CreditCard,
  FileText,
  LifeBuoy,
  Settings,
  Shield,
  MessageSquare,
  Clock,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { agentAPI } from '../../services/api';

// ─── Navigation items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { name: 'Dashboard',  href: '/agent/dashboard',  icon: LayoutDashboard },
  { name: 'Packages',   href: '/agent/packages',   icon: Package, badge: '23' },
  { name: 'Bookings',   href: '/agent/bookings',   icon: Calendar },
  { name: 'Analytics',  href: '/agent/analytics',  icon: BarChart3 },
  { name: 'Payments',   href: '/agent/payments',   icon: CreditCard, badge: 'New', badgeColor: 'teal' },
  { name: 'Support',    href: '/agent/support',    icon: LifeBuoy },
];

// ─── Profile Dropdown ──────────────────────────────────────────────────────────
function ProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const MENU_ITEMS = [
    { label: 'My Profile', icon: User, href: '/agent/profile' },
    { label: 'Account Settings', icon: Settings, href: '/agent/settings' },
    { label: 'Payment Methods', icon: CreditCard, href: '/agent/payments' },
    { label: 'Notifications', icon: Bell, href: '/agent/notifications' },
    { label: 'Documents', icon: FileText, href: '/agent/documents' },
    { label: 'Security', icon: Shield, href: '/agent/security' },
    { label: 'Help & Support', icon: LifeBuoy, href: '/agent/support' },
  ];

  const handleMenuClick = (href) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 pl-4 border-l border-gray-200 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900 leading-tight">
            {user?.name || 'Agent'}
          </p>
          <p className="text-xs text-gray-500">Senior Agent</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 transition-all duration-200 origin-top-right ${
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* User info header */}
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-700/50">
          <p className="text-sm font-semibold text-slate-100">{user?.name || 'Agent'}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
        </div>

        {/* Menu items */}
        <div className="py-1">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleMenuClick(item.href)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-200 hover:bg-slate-700 transition-colors text-left"
            >
              <item.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Divider + Logout */}
        <div className="border-t border-slate-700 py-1">
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification helpers ──────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getNotifIcon(type) {
  if (type === 'booking_status_changed' || type === 'agent_assigned') {
    return <Calendar className="w-4 h-4 text-blue-500" />;
  }
  if (type === 'withdrawal_status') {
    return <CreditCard className="w-4 h-4 text-teal-500" />;
  }
  if (type === 'ticket_reply' || type === 'ticket_status_changed' || type === 'ticket_created') {
    return <MessageSquare className="w-4 h-4 text-purple-500" />;
  }
  return <Bell className="w-4 h-4 text-gray-400" />;
}

// ─── Notification Dropdown ─────────────────────────────────────────────────────
function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count (used for badge)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await agentAPI.getUnreadCount();
      setUnreadCount(res.data?.data?.count ?? 0);
    } catch {
      // silently ignore — badge just stays stale
    }
  }, []);

  // On mount: fetch badge count + poll every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // When dropdown opens, fetch notifications
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    agentAPI.getNotifications({ limit: 20 })
      .then((res) => {
        setNotifications(res.data?.data?.notifications ?? []);
        setUnreadCount(res.data?.data?.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await agentAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleNotifClick = async (n) => {
    if (!n.isRead) {
      try {
        await agentAPI.markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item)
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    if (n.actionUrl) {
      setOpen(false);
      navigate(n.actionUrl);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${
          open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                Mark all read
              </button>
            )}
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="space-y-0 divide-y divide-gray-50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No new notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-teal-50/40' : ''}`}
              >
                <div className="mt-0.5 flex-shrink-0">{getNotifIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-2.5">
          <button
            onClick={() => { setOpen(false); navigate('/agent/notifications'); }}
            className="w-full text-xs text-teal-600 hover:text-teal-700 font-semibold text-center"
          >
            View all notifications →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({ item, isActive, onClick }) {
  const content = (
    <>
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium flex-1">{item.name}</span>
      {item.badge && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
            item.badgeColor === 'red'
              ? 'bg-red-500 text-white'
              : item.badgeColor === 'teal'
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {item.badge}
        </span>
      )}
    </>
  );

  const baseClass = `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
    isActive
      ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-200/50'
      : 'text-[#0D6E63] hover:bg-[#F0FDFA]'
  }`;

  // Hash links don't navigate — use button to show coming-soon
  if (item.href === '#') {
    return (
      <button onClick={onClick} className={`w-full ${baseClass}`}>
        {content}
      </button>
    );
  }

  return (
    <Link to={item.href} className={baseClass}>
      {content}
    </Link>
  );
}

// ─── AgentLayout ───────────────────────────────────────────────────────────────
export function AgentLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const addToast = useToast();

  const handleLogout = () => {
    logout();
    navigate('/agent/login');
  };

  const isActive = (href) => {
    if (href === '#') return false;
    if (href === '/agent/dashboard') return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[240px] bg-white border-r border-teal-100/70 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-teal-100/70">
          <Link to="/agent/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#022C22]">TravelAgent</h1>
              <p className="text-xs text-teal-700/60">Pro Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-teal-700/60">Workspace</p>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              isActive={isActive(item.href)}
              onClick={() => {}}
            />
          ))}
        </nav>

        {/* Bottom: user profile card + logout */}
        <div className="p-4 border-t border-teal-100/70 space-y-3">
          {/* User profile card */}
          {(() => {
            const initials = user?.name
              ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : 'AG';
            return (
              <div className="mt-1 flex items-center gap-3 px-3 py-2 rounded-lg bg-teal-50/50 border border-teal-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white grid place-content-center text-sm font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#022C22] truncate">{user?.name}</p>
                  <p className="text-xs text-teal-700/70 truncate">Travel Agent</p>
                </div>
              </div>
            );
          })()}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#0D6E63] hover:bg-[#F0FDFA] transition-all text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-teal-100/70 px-6 md:px-7 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search open trips, applications, and assigned travelers..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationDropdown />

              <ProfileDropdown user={user} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

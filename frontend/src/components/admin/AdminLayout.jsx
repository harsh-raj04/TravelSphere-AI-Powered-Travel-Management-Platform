import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck2, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: CalendarCheck2 },
];

export function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const name = user?.name || 'Admin';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="flex">
        <aside className="hidden md:flex md:w-60 md:flex-col bg-white border-r border-gray-200 min-h-screen">
          <div className="h-16 px-5 border-b border-gray-200 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-900 text-white flex items-center justify-center font-semibold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">TravelSphere</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Platform Control Center</p>
              <h1 className="text-base font-semibold text-gray-900">Admin Workspace</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'admin@travelsphere.dev'}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </header>

          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

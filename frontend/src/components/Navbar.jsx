import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './ui/Button';
import {
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  Compass,
  Calendar,
  MapPin,
  CreditCard,
  User,
  Shield,
  LayoutDashboard,
} from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const customerNavItems = [
    { path: '/', label: 'Home', icon: Sparkles },
    { path: '/packages', label: 'Packages', icon: Compass },
    { path: '/bookings', label: 'Bookings', icon: CreditCard },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const agentNavItems = [
    { path: '/agent/dashboard', label: 'Dashboard', icon: Sparkles },
    { path: '/agent/bookings', label: 'Bookings', icon: CreditCard },
    { path: '/agent/analytics', label: 'Analytics', icon: Compass },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/bookings', label: 'Bookings', icon: Shield },
  ];

  const displayNavItems = user?.role === 'agent'
    ? agentNavItems
    : user?.role === 'admin'
      ? adminNavItems
      : customerNavItems;

  const publicNavItems = [
    { path: '/', label: 'Home', icon: Sparkles },
    { path: '/packages', label: 'Packages', icon: Compass },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-teal-100/70 dark:border-teal-900/30 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[70px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200/50">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent hidden sm:inline">
              TravelSphere
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                {displayNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-200/50'
                          : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="flex items-center gap-3 pl-4 ml-2 border-l border-light-border dark:border-dark-border">
                  <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {user.email?.split('@')[0]}
                  </span>
                  <Button variant="secondary" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                {publicNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-200/50'
                          : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="flex items-center gap-2 pl-4 ml-2 border-l border-light-border dark:border-dark-border">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">Sign Up</Button>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle + Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden pb-4 flex flex-col gap-2">
            {user ? (
              <>
                {displayNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white'
                          : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <Button variant="secondary" size="sm" fullWidth onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                {publicNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white'
                          : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="border-t border-light-border dark:border-dark-border pt-2 mt-1 flex gap-2">
                  <Link to="/login" className="flex-1">
                    <Button variant="secondary" fullWidth size="sm">Login</Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button variant="primary" fullWidth size="sm">Sign Up</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

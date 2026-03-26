import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './ui/Button';
import { Menu, X, Sun, Moon, Sparkles, Compass, Calendar, MapPin, CreditCard, User } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Sparkles },
    { path: '/discover', label: 'Discover', icon: Compass },
    { path: '/trips', label: 'My Trips', icon: Calendar },
    { path: '/plan', label: 'Plan Trip', icon: MapPin },
    { path: '/bookings', label: 'Bookings', icon: CreditCard },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/85 dark:bg-dark-bg-secondary/90 backdrop-blur-lg border-b border-light-border dark:border-dark-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[70px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-sky-700 via-indigo-700 to-fuchsia-700 dark:from-sky-400 dark:via-indigo-400 dark:to-fuchsia-400 bg-clip-text text-transparent hidden sm:inline">
              TravelSphere
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 text-white shadow-md'
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
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary">Sign Up</Button>
                </Link>
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
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 text-white'
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
                <Link to="/login">
                  <Button variant="secondary" fullWidth>Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" fullWidth>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

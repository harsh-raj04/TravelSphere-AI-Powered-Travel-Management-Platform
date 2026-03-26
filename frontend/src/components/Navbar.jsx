import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './ui/Button';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-light-bg-tertiary dark:bg-dark-bg-secondary border-b border-light-border dark:border-dark-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="font-bold text-xl text-light-text-primary dark:text-dark-text-primary hidden sm:inline">
              TravelSphere
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link
                  to="/packages"
                  className="text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-secondary transition"
                >
                  Explore
                </Link>
                <Link
                  to="/bookings"
                  className="text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-secondary transition"
                >
                  My Bookings
                </Link>
                <div className="flex items-center gap-3 pl-8 border-l border-light-border dark:border-dark-border">
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
              className="md:hidden p-2 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary"
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
          <div className="md:hidden pb-4 flex flex-col gap-3">
            {user ? (
              <>
                <Link to="/packages" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary">
                  Explore
                </Link>
                <Link to="/bookings" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary">
                  My Bookings
                </Link>
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

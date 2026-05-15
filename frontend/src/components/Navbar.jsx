import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './ui/Button';
import {
  Menu, X, Sun, Moon, Sparkles, Compass, CreditCard, User,
  Shield, LayoutDashboard, ChevronDown, MessageSquare,
  Wand2, Users, MapPin, LogOut, Calendar, FileText, Info, Home, Grid3X3, HelpCircle,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const PACKAGE_CATEGORIES = [
  { label: 'Group Tours', path: '/packages?category=group_tours' },
  { label: 'Family Tours', path: '/packages?category=family_tours' },
  { label: 'Weekend Trips', path: '/packages?category=weekend_trips' },
  { label: 'Pilgrimage', path: '/packages?category=pilgrimage' },
];

const LOCATION_ROOMS = [
  { label: 'Manali', slug: 'manali' },
  { label: 'Shimla', slug: 'shimla' },
  { label: 'Goa', slug: 'goa' },
  { label: 'Kerala', slug: 'kerala' },
  { label: 'Rajasthan', slug: 'rajasthan' },
  { label: 'Kashmir', slug: 'kashmir' },
  { label: 'Ladakh', slug: 'ladakh' },
  { label: 'Northeast', slug: 'northeast' },
  { label: 'Uttarakhand', slug: 'uttarakhand' },
];

function NavDropdown({ label, icon: Icon, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-2 z-50">
          <div className="min-w-[13rem] max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700/60 py-1.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function DropItem({ to, onClick, icon: Icon, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />}
      {children}
    </Link>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobilePackagesOpen, setMobilePackagesOpen] = useState(false);
  const [mobileCommunityOpen, setMobileCommunityOpen] = useState(false);
  const profileRef = useRef(null);

  const isAgent = user?.role === 'agent';
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';
  const isPublic = !user;

  useEffect(() => {
    setIsOpen(false);
    setMobilePackagesOpen(false);
    setMobileCommunityOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    function close(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
    setIsOpen(false);
  };

  const agentNavItems = [
    { path: '/agent/dashboard', label: 'Dashboard', icon: Sparkles },
    { path: '/agent/bookings', label: 'Bookings', icon: CreditCard },
    { path: '/agent/analytics', label: 'Analytics', icon: Compass },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/bookings', label: 'Bookings', icon: Shield },
  ];

  const staffItems = isAgent ? agentNavItems : isAdmin ? adminNavItems : [];

  function activeCls(path) {
    const isActive = path === '/' ? location.pathname === path : location.pathname.startsWith(path);
    return isActive
      ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-200/50'
      : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20';
  }

  function mobileActiveCls(path) {
    const isActive = path === '/' ? location.pathname === path : location.pathname.startsWith(path);
    return isActive ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
  }

  return (
    <>
      <nav className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-teal-100/70 dark:border-teal-900/30 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[70px] gap-3">
            {/* Logo */}
            <Link to="/" aria-label="TravelSphere home" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-11 h-11 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200/50">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent hidden sm:inline">
                TravelSphere
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0">
              {/* Agent / Admin nav */}
              {(isAgent || isAdmin) && staffItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeCls(item.path)}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Customer / Public nav */}
              {(isCustomer || isPublic) && (
                <div className="flex items-center gap-1">
                  <Link to="/" className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeCls('/')}`}>
                    <Home className="w-4 h-4" />
                    Home
                  </Link>

                  <NavDropdown label="Packages" icon={Compass}>
                    <DropItem to="/packages">All Packages</DropItem>
                    <div className="border-t border-slate-100 dark:border-slate-700/60 my-1" />
                    {PACKAGE_CATEGORIES.map((cat) => (
                      <DropItem key={cat.path} to={cat.path}>{cat.label}</DropItem>
                    ))}
                  </NavDropdown>

                  <Link to="/customize-package" className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeCls('/customize-package')}`}>
                    <Wand2 className="w-4 h-4" />
                    Customize
                  </Link>

                  <Link to="/trip-planner" className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeCls('/trip-planner')}`}>
                    <Sparkles className="w-4 h-4" />
                    Trip Planner
                  </Link>

                  <NavDropdown label="Community" icon={Users}>
                    <DropItem to="/community/public-chat" icon={MessageSquare}>Public Chat</DropItem>
                    <div className="border-t border-slate-100 dark:border-slate-700/60 my-1">
                      <p className="px-4 pt-1 pb-0.5 text-xs text-slate-400 font-medium">Location Rooms</p>
                    </div>
                    {LOCATION_ROOMS.map((room) => (
                      <DropItem key={room.slug} to={`/community/location/${room.slug}`} icon={MapPin}>
                        {room.label}
                      </DropItem>
                    ))}
                  </NavDropdown>

                  <Link to="/about" className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeCls('/about')}`}>
                    <Info className="w-4 h-4" />
                    About
                  </Link>
                </div>
              )}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Theme toggle */}
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

              {/* Staff logout (desktop) */}
              {(isAgent || isAdmin) && (
                <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-light-border dark:border-dark-border">
                  <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate max-w-[100px]">
                    {user.email?.split('@')[0]}
                  </span>
                  <Button variant="secondary" size="sm" onClick={handleLogout}>Logout</Button>
                </div>
              )}

              {/* Customer profile dropdown (desktop) */}
              {isCustomer && (
                <div ref={profileRef} className="hidden lg:block relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 transition-colors bg-white dark:bg-slate-800/60"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[80px] truncate">
                      {user.name?.split(' ')[0] || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700/60 py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name || 'Traveler'}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
                      </div>
                      <DropItem to="/home" onClick={() => setProfileOpen(false)} icon={Grid3X3}>Dashboard</DropItem>
                      <DropItem to="/profile" onClick={() => setProfileOpen(false)} icon={User}>My Profile</DropItem>
                      <DropItem to="/bookings" onClick={() => setProfileOpen(false)} icon={Calendar}>My Bookings</DropItem>
                      <DropItem to="/my-account/requests" onClick={() => setProfileOpen(false)} icon={FileText}>My Requests</DropItem>
                      <DropItem to="/support" onClick={() => setProfileOpen(false)} icon={HelpCircle}>Support</DropItem>
                      <div className="border-t border-slate-100 dark:border-slate-700/60 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Public auth buttons (desktop) */}
              {isPublic && (
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                  <Link to="/register"><Button variant="primary" size="sm">Sign Up</Button></Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-2 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-in drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-[280px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-[70px] border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Scrollable nav items */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {/* Staff mobile nav */}
              {(isAgent || isAdmin) && staffItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all ${mobileActiveCls(item.path)}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Customer / Public mobile nav */}
              {(isCustomer || isPublic) && (
                <>
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all ${mobileActiveCls('/')}`}
                  >
                    <Home className="w-4 h-4" /> Home
                  </Link>

                  {/* Packages accordion */}
                  <div className="mb-0.5">
                    <button
                      onClick={() => setMobilePackagesOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <span className="flex items-center gap-3"><Compass className="w-4 h-4" /> Packages</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobilePackagesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobilePackagesOpen && (
                      <div className="ml-6 mt-1 border-l-2 border-teal-100 dark:border-teal-900/50 pl-3 flex flex-col gap-0.5">
                        <Link to="/packages" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">All Packages</Link>
                        {PACKAGE_CATEGORIES.map((cat) => (
                          <Link key={cat.path} to={cat.path} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">{cat.label}</Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to="/customize-package"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all ${mobileActiveCls('/customize-package')}`}
                  >
                    <Wand2 className="w-4 h-4" /> Customize Package
                  </Link>

                  <Link
                    to="/trip-planner"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all ${mobileActiveCls('/trip-planner')}`}
                  >
                    <Sparkles className="w-4 h-4" /> Trip Planner
                  </Link>

                  {/* Community accordion */}
                  <div className="mb-0.5">
                    <button
                      onClick={() => setMobileCommunityOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <span className="flex items-center gap-3"><Users className="w-4 h-4" /> Community</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileCommunityOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileCommunityOpen && (
                      <div className="ml-6 mt-1 border-l-2 border-teal-100 dark:border-teal-900/50 pl-3 flex flex-col gap-0.5">
                        <Link to="/community/public-chat" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Public Chat</Link>
                        <p className="px-3 py-0.5 text-xs text-slate-400 font-medium">Location Rooms</p>
                        {LOCATION_ROOMS.map((room) => (
                          <Link key={room.slug} to={`/community/location/${room.slug}`} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">{room.label}</Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to="/about"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all ${mobileActiveCls('/about')}`}
                  >
                    <Info className="w-4 h-4" /> About Us
                  </Link>
                </>
              )}
            </div>

            {/* Drawer footer */}
            <div className="border-t border-slate-100 dark:border-slate-700/60 p-4 flex-shrink-0">
              {isCustomer && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user.name || 'Traveler'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/home"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-900/30 transition mb-2"
                  >
                    <Grid3X3 className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    to="/support"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition mb-2"
                  >
                    <HelpCircle className="w-4 h-4" /> Support
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              )}
              {(isAgent || isAdmin) && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              )}
              {isPublic && (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1">
                    <Button variant="secondary" fullWidth size="sm">Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1">
                    <Button variant="primary" fullWidth size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

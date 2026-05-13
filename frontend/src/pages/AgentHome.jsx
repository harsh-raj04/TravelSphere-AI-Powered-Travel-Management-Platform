import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import {
  Layers,
  Compass,
  BarChart3,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  Menu,
  X,
  ChevronDown,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Play,
  Zap,
  TrendingUp,
  Shield,
  Star,
  Building2,
  Headphones,
  DollarSign,
  Smartphone,
  Network,
  AlertCircle,
} from 'lucide-react';
import { normalizeRole } from '../utils/roleRouting';

/* ─── Design tokens ─── */
const T = {
  teal: '#14B8A6',
  tealDark: '#0F766E',
  tealLight: '#5EEAD4',
  bgDark: '#0F172A',
  bgCard: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  accentOrange: '#F97316',
};

/* ─── Animated counter hook ─── */
function useCountUp(target, duration = 1800, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return value;
}

/* ─── Intersection observer hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── LoginModal ─── */
function LoginModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('agent');
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login({ email: form.email, password: form.password });
      const nextUser = res.data.data.user;
      if (normalizeRole(nextUser?.role) !== 'agent') {
        setError('This portal is only for agent accounts.');
        setLoading(false);
        return;
      }
      login(res.data.data.token, nextUser);
      navigate('/agent/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'modalFadeIn 0.25s ease-out',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: T.bgCard,
        border: `1px solid rgba(20,184,166,0.25)`,
        borderRadius: '20px',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
        animation: 'modalSlideUp 0.3s ease-out',
      }}>
        {/* Modal header */}
        <div style={{
          background: `linear-gradient(135deg, ${T.bgDark} 0%, #1a2744 100%)`,
          padding: '28px 28px 0',
          borderBottom: `1px solid rgba(20,184,166,0.15)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: `linear-gradient(135deg, ${T.teal}, ${T.tealLight})`,
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontWeight: 800, color: T.bgDark, fontSize: '16px' }}>K</span>
              </div>
              <span style={{ color: T.textPrimary, fontWeight: 700, fontSize: '16px' }}>TravelSphere</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(148,163,184,0.15)', border: 'none', cursor: 'pointer',
                borderRadius: '8px', padding: '6px', color: T.textSecondary, lineHeight: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[['agent', 'Agent Login'], ['shared', 'Shared Login']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(''); }}
                style={{
                  flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
                  borderRadius: '10px 10px 0 0', fontWeight: 600, fontSize: '14px',
                  transition: 'all 0.2s',
                  background: tab === key ? T.bgCard : 'transparent',
                  color: tab === key ? T.teal : T.textSecondary,
                  borderBottom: tab === key ? `2px solid ${T.teal}` : '2px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: '28px' }}>
          <h2 style={{ color: T.textPrimary, fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
            Welcome Back
          </h2>
          <p style={{ color: T.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
            Sign in to your {tab === 'agent' ? 'agent' : ''} account to continue
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '10px', padding: '12px 14px', marginBottom: '18px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
              <span style={{ color: '#f87171', fontSize: '13px' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Email / Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.textSecondary }} />
                <input
                  type="email"
                  required
                  placeholder="agent@travelsphere.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.6)',
                    border: `1px solid rgba(20,184,166,0.2)`,
                    borderRadius: '10px', padding: '12px 14px 12px 40px',
                    color: T.textPrimary, fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = T.teal}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(20,184,166,0.2)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: T.textSecondary }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.6)',
                    border: `1px solid rgba(20,184,166,0.2)`,
                    borderRadius: '10px', padding: '12px 42px 12px 40px',
                    color: T.textPrimary, fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = T.teal}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(20,184,166,0.2)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: T.textSecondary, lineHeight: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  style={{ accentColor: T.teal, width: '15px', height: '15px' }}
                />
                <span style={{ color: T.textSecondary, fontSize: '13px' }}>Remember me</span>
              </label>
              <a href="#" style={{ color: T.teal, fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'rgba(20,184,166,0.5)' : `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
                border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
                color: '#fff', fontWeight: 700, fontSize: '15px',
                transition: 'all 0.2s', boxShadow: loading ? 'none' : `0 4px 20px rgba(20,184,166,0.35)`,
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: T.textSecondary, fontSize: '13px', marginTop: '20px' }}>
            New to TravelSphere?{' '}
            <a href="/agent/register" style={{ color: T.teal, fontWeight: 700, textDecoration: 'none' }}>
              Register as Agent
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Stats bar ─── */
function StatsBar() {
  const [ref, inView] = useInView(0.3);
  const agents = useCountUp(5000, 1600, inView);
  const destinations = useCountUp(150, 1400, inView);

  const stats = [
    { value: `${agents.toLocaleString()}+`, label: 'Agents Nationwide', icon: Network },
    { value: `${destinations}+`, label: 'Destinations Worldwide', icon: Globe },
    { value: '24/7', label: 'Support Available', icon: Headphones },
  ];

  return (
    <div
      ref={ref}
      style={{
        background: `linear-gradient(90deg, rgba(14,116,144,0.12) 0%, rgba(20,184,166,0.08) 100%)`,
        borderTop: `1px solid rgba(20,184,166,0.15)`,
        borderBottom: `1px solid rgba(20,184,166,0.15)`,
        padding: '28px 24px',
      }}
    >
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }}>
        {stats.map(({ value, label, icon: Icon }, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '14px', padding: '12px 0',
              borderRight: i < 2 ? `1px solid rgba(20,184,166,0.2)` : 'none',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s`,
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: `linear-gradient(135deg, rgba(20,184,166,0.2), rgba(94,234,212,0.1))`,
              border: `1px solid rgba(20,184,166,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} style={{ color: T.teal }} />
            </div>
            <div>
              <div style={{ color: T.teal, fontWeight: 800, fontSize: '26px', lineHeight: 1.1 }}>{value}</div>
              <div style={{ color: T.textSecondary, fontSize: '13px', marginTop: '2px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({ icon: Icon, title, description, link, delay, inView }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(30,41,59,0.6)',
        backdropFilter: 'blur(12px)',
        border: hovered ? `1px solid rgba(20,184,166,0.5)` : `1px solid rgba(20,184,166,0.2)`,
        borderRadius: '16px', padding: '32px',
        display: 'flex', flexDirection: 'column', gap: '16px',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transform: inView
          ? (hovered ? 'translateY(-8px)' : 'translateY(0)')
          : 'translateY(40px)',
        opacity: inView ? 1 : 0,
        boxShadow: hovered
          ? `0 20px 40px rgba(20,184,166,0.2), 0 0 0 1px rgba(20,184,166,0.15)`
          : '0 4px 20px rgba(0,0,0,0.25)',
        transitionDelay: inView ? `${delay}s` : '0s',
        cursor: 'default',
      }}
    >
      <div style={{
        width: '64px', height: '64px', borderRadius: '14px',
        background: `linear-gradient(135deg, ${T.teal}, ${T.tealLight})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'transform 0.4s ease',
        transform: hovered ? 'rotate(360deg) scale(1.1)' : 'rotate(0deg) scale(1)',
      }}>
        <Icon size={28} style={{ color: T.bgDark }} />
      </div>
      <div>
        <h3 style={{ color: T.textPrimary, fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ color: T.textSecondary, fontSize: '14px', lineHeight: 1.7 }}>
          {description}
        </p>
      </div>
      <a
        href={link}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: T.teal, fontSize: '14px', fontWeight: 600, textDecoration: 'none',
          marginTop: 'auto',
          transition: 'gap 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.gap = '10px'}
        onMouseLeave={(e) => e.currentTarget.style.gap = '6px'}
      >
        Explore <ArrowRight size={14} />
      </a>
    </div>
  );
}

/* ─── Benefits item ─── */
function BenefitItem({ icon: Icon, title, delay, inView }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        background: 'rgba(30,41,59,0.4)',
        border: `1px solid rgba(20,184,166,0.12)`,
        borderRadius: '12px', padding: '18px 22px',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateX(0)' : 'translateX(-30px)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        background: `rgba(20,184,166,0.15)`,
        border: `1px solid rgba(20,184,166,0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} style={{ color: T.teal }} />
      </div>
      <span style={{ color: T.textPrimary, fontWeight: 600, fontSize: '15px' }}>{title}</span>
      <CheckCircle size={16} style={{ color: T.teal, marginLeft: 'auto', flexShrink: 0 }} />
    </div>
  );
}

/* ─── Trust badge ─── */
function TrustBadge({ icon: Icon, value, label, delay, inView }) {
  return (
    <div style={{
      textAlign: 'center', padding: '28px 20px',
      background: 'rgba(30,41,59,0.5)',
      border: `1px solid rgba(20,184,166,0.15)`,
      borderRadius: '14px',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
      transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
    }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 14px',
        background: `linear-gradient(135deg, rgba(20,184,166,0.25), rgba(94,234,212,0.1))`,
        border: `1px solid rgba(20,184,166,0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} style={{ color: T.teal }} />
      </div>
      <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: '20px', marginBottom: '4px' }}>{value}</div>
      <div style={{ color: T.textSecondary, fontSize: '13px' }}>{label}</div>
    </div>
  );
}

/* ─── Main AgentHome ─── */
export function AgentHome() {
  const [modalOpen, setModalOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  const [featuresRef, featuresInView] = useInView(0.1);
  const [benefitsRef, benefitsInView] = useInView(0.1);
  const [trustRef, trustInView] = useInView(0.1);

  // Trigger hero animation on mount
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#benefits' },
    { label: 'Contact', href: '#footer' },
  ];

  const features = [
    {
      icon: Layers,
      title: 'Package Studio',
      description: 'Create, customize, and publish travel packages in minutes. Manage itineraries, pricing, and availability from one intuitive dashboard.',
      link: '/agent/login',
    },
    {
      icon: Compass,
      title: 'Booking Control',
      description: 'Track and manage all client bookings in real time. Handle confirmations, cancellations, and status updates with full visibility.',
      link: '/agent/login',
    },
    {
      icon: BarChart3,
      title: 'Performance View',
      description: 'Monitor revenue trends, conversion rates, and booking analytics. Make data-driven decisions to maximize your commissions.',
      link: '/agent/login',
    },
  ];

  const benefits = [
    { icon: TrendingUp, title: 'Fast Growing B2B Network' },
    { icon: Headphones, title: '24/7 Support Helpline' },
    { icon: DollarSign, title: 'Multiple Income Streams' },
    { icon: Star, title: 'Best Commissions in Industry' },
    { icon: Shield, title: 'Exclusive Agent Portal' },
    { icon: Zap, title: 'Latest Deals & Offers' },
  ];

  const trustBadges = [
    { icon: Network, value: 'API/XML', label: 'Integration Support' },
    { icon: Building2, value: '300+', label: 'Airlines' },
    { icon: Globe, value: '300,000+', label: 'Hotels Worldwide' },
    { icon: Smartphone, value: 'Mobile', label: 'Friendly Platform' },
  ];

  return (
    <div style={{
      background: T.bgDark,
      color: T.textPrimary,
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      {/* ── CSS keyframes injected inline ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');
        @keyframes modalFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalSlideUp { from { transform:translateY(32px) scale(0.97); opacity:0 } to { transform:translateY(0) scale(1); opacity:1 } }
        @keyframes heroFadeIn { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(20,184,166,0.4); }
          70% { box-shadow: 0 0 0 16px rgba(20,184,166,0); }
          100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::placeholder { color: #475569; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: rgba(20,184,166,0.4); border-radius: 3px; }
      `}</style>

      {/* ════════════ NAVBAR ════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
        background: navScrolled
          ? 'rgba(15,23,42,0.92)'
          : 'rgba(15,23,42,0.4)',
        backdropFilter: navScrolled ? 'blur(20px)' : 'blur(8px)',
        borderBottom: navScrolled
          ? `1px solid rgba(20,184,166,0.2)`
          : '1px solid transparent',
        transition: 'all 0.35s ease',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '68px',
        }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 16px rgba(20,184,166,0.4)`,
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '18px', fontFamily: 'Outfit, sans-serif' }}>K</span>
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: '15px', fontFamily: 'Outfit, sans-serif' }}>
                TravelSphere
              </div>
              <div style={{ color: T.teal, fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em' }}>
                B2B PLATFORM
              </div>
            </div>
          </a>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="hidden-mobile">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{
                  color: T.textSecondary, textDecoration: 'none',
                  padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
                  transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = T.textPrimary; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = T.textSecondary; e.currentTarget.style.background = 'transparent'; }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                color: '#fff', fontWeight: 700, fontSize: '14px',
                padding: '9px 18px',
                boxShadow: `0 4px 16px rgba(20,184,166,0.35)`,
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = `0 6px 24px rgba(20,184,166,0.5)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 16px rgba(20,184,166,0.35)`; }}
            >
              Agent Login <ChevronDown size={14} />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer',
                borderRadius: '8px', padding: '8px', color: T.textPrimary, lineHeight: 0,
                display: 'none',
              }}
              className="show-mobile"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div style={{
            borderTop: `1px solid rgba(20,184,166,0.15)`,
            padding: '16px 0 20px',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: T.textSecondary, textDecoration: 'none',
                  padding: '10px 8px', borderRadius: '8px', fontSize: '15px', fontWeight: 500,
                }}
              >
                {label}
              </a>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); setModalOpen(true); }}
              style={{
                marginTop: '8px',
                background: `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                color: '#fff', fontWeight: 700, fontSize: '14px', padding: '11px',
              }}
            >
              Agent Login
            </button>
          </div>
        )}
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${T.bgDark} 0%, #1E293B 50%, #0F766E 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        padding: '120px 24px 80px',
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-8%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(94,234,212,0.08) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
          backgroundImage: `linear-gradient(rgba(20,184,166,1) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div style={{ maxWidth: '860px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(20,184,166,0.12)',
            border: `1px solid rgba(20,184,166,0.3)`,
            borderRadius: '100px', padding: '7px 18px', marginBottom: '28px',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease 0s',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: T.teal, animation: 'pulse-ring 2s infinite' }} />
            <span style={{ color: T.teal, fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em' }}>
              TRAVELSPHERE · B2B PLATFORM
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'Outfit, Inter, sans-serif',
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 900, lineHeight: 1.08, marginBottom: '20px',
            background: `linear-gradient(135deg, #fff 20%, ${T.teal} 60%, ${T.tealLight} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'all 0.65s ease 0.12s',
          }}>
            Sell Better.{' '}
            <span style={{
              background: `linear-gradient(135deg, ${T.teal}, ${T.tealLight})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Manage Faster.
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            color: T.textSecondary,
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            lineHeight: 1.7, maxWidth: '660px', margin: '0 auto 40px',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.65s ease 0.24s',
          }}>
            Dedicated portal for travel agents to create packages, track bookings, and grow revenue with powerful analytics.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.65s ease 0.36s',
          }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                color: '#fff', fontWeight: 700, fontSize: '16px',
                padding: '14px 30px',
                boxShadow: `0 8px 32px rgba(20,184,166,0.4)`,
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(20,184,166,0.6)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(20,184,166,0.4)`; }}
            >
              Get Started <ArrowRight size={18} />
            </button>

            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'transparent',
                border: `2px solid rgba(20,184,166,0.5)`, borderRadius: '12px', cursor: 'pointer',
                color: T.teal, fontWeight: 700, fontSize: '16px',
                padding: '14px 30px',
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(20,184,166,0.08)';
                e.currentTarget.style.borderColor = T.teal;
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(20,184,166,0.5)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Play size={18} /> Watch Demo
            </button>
          </div>

          {/* Floating stat chips */}
          <div style={{
            display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
            marginTop: '52px',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.65s ease 0.5s',
          }}>
            {[
              { icon: Shield, label: 'Trusted by 5000+ Agents' },
              { icon: Star, label: 'Highest Commission Rates' },
              { icon: Zap, label: 'Instant Booking Confirmation' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(30,41,59,0.7)', backdropFilter: 'blur(10px)',
                border: `1px solid rgba(20,184,166,0.2)`,
                borderRadius: '100px', padding: '8px 16px',
              }}>
                <Icon size={14} style={{ color: T.teal }} />
                <span style={{ color: T.textSecondary, fontSize: '13px', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ STATS BAR ════════════ */}
      <StatsBar />

      {/* ════════════ FEATURES ════════════ */}
      <section id="features" ref={featuresRef} style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{
              display: 'inline-block', color: T.teal, fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px',
              background: 'rgba(20,184,166,0.1)', border: `1px solid rgba(20,184,166,0.2)`,
              borderRadius: '100px', padding: '5px 16px',
            }}>
              Platform Features
            </span>
            <h2 style={{
              fontFamily: 'Outfit, Inter, sans-serif',
              fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: T.textPrimary,
              marginBottom: '14px',
            }}>
              Everything You Need to{' '}
              <span style={{ color: T.teal }}>Succeed</span>
            </h2>
            <p style={{ color: T.textSecondary, fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              A complete toolkit designed specifically for professional travel agents to operate at scale.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.12} inView={featuresInView} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ BENEFITS ════════════ */}
      <section
        id="benefits"
        ref={benefitsRef}
        style={{
          padding: 'clamp(60px, 8vw, 100px) 24px',
          background: `linear-gradient(180deg, transparent 0%, rgba(20,184,166,0.04) 50%, transparent 100%)`,
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="benefits-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center',
          }}>
            {/* Left column — heading */}
            <div style={{
              opacity: benefitsInView ? 1 : 0,
              transform: benefitsInView ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'all 0.6s ease',
            }}>
              <span style={{
                display: 'inline-block', color: T.teal, fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px',
                background: 'rgba(20,184,166,0.1)', border: `1px solid rgba(20,184,166,0.2)`,
                borderRadius: '100px', padding: '5px 16px',
              }}>
                Why Choose Us
              </span>
              <h2 style={{
                fontFamily: 'Outfit, Inter, sans-serif',
                fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: T.textPrimary,
                lineHeight: 1.2, marginBottom: '18px',
              }}>
                Why Choose{' '}
                <span style={{ color: T.teal }}>TravelSphere</span>{' '}
                as Your B2B Partner?
              </h2>
              <p style={{ color: T.textSecondary, fontSize: '15px', lineHeight: 1.8, marginBottom: '28px' }}>
                Join thousands of travel professionals who trust TravelSphere for a reliable, profitable, and technologically advanced B2B experience.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  color: '#fff', fontWeight: 700, fontSize: '14px', padding: '12px 24px',
                  boxShadow: `0 4px 20px rgba(20,184,166,0.35)`,
                  transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Join Now <ArrowRight size={16} />
              </button>
            </div>

            {/* Right column — benefit items */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {benefits.map((b, i) => (
                <BenefitItem key={i} {...b} delay={i * 0.08} inView={benefitsInView} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ TRUST INDICATORS ════════════ */}
      <section
        ref={trustRef}
        style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'Outfit, Inter, sans-serif',
            fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: T.textPrimary,
            marginBottom: '12px',
          }}>
            Powered by Global Inventory
          </h2>
          <p style={{ color: T.textSecondary, fontSize: '15px', marginBottom: '48px', maxWidth: '500px', margin: '0 auto 48px' }}>
            Access the world's largest travel inventory through a single integrated platform.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px',
          }}>
            {trustBadges.map((b, i) => (
              <TrustBadge key={i} {...b} delay={i * 0.1} inView={trustInView} />
            ))}
          </div>

          {/* CTA banner */}
          <div style={{
            marginTop: '60px',
            background: `linear-gradient(135deg, rgba(15,118,110,0.25) 0%, rgba(20,184,166,0.15) 100%)`,
            border: `1px solid rgba(20,184,166,0.3)`,
            borderRadius: '20px', padding: 'clamp(32px, 5vw, 52px) clamp(24px, 5vw, 60px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '24px',
            opacity: trustInView ? 1 : 0,
            transform: trustInView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.6s ease 0.4s',
          }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ color: T.textPrimary, fontWeight: 800, fontSize: 'clamp(18px, 2.5vw, 26px)', marginBottom: '8px' }}>
                Ready to grow your travel business?
              </h3>
              <p style={{ color: T.textSecondary, fontSize: '15px' }}>
                Register as an agent today and start earning better commissions.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="/agent/register"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
                  borderRadius: '10px', textDecoration: 'none',
                  color: '#fff', fontWeight: 700, fontSize: '15px', padding: '12px 26px',
                  boxShadow: `0 4px 20px rgba(20,184,166,0.4)`,
                  transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Register as Agent <ArrowRight size={16} />
              </a>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'transparent',
                  border: `2px solid rgba(20,184,166,0.5)`, borderRadius: '10px', cursor: 'pointer',
                  color: T.teal, fontWeight: 700, fontSize: '15px', padding: '12px 26px',
                  transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(20,184,166,0.08)'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer id="footer" style={{
        background: '#080F1E',
        borderTop: `1px solid rgba(20,184,166,0.12)`,
        padding: 'clamp(40px, 6vw, 64px) 24px 28px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px', marginBottom: '40px',
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>K</span>
                </div>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: '14px' }}>TravelSphere</div>
                  <div style={{ color: T.teal, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em' }}>B2B PLATFORM</div>
                </div>
              </div>
              <p style={{ color: T.textSecondary, fontSize: '13px', lineHeight: 1.8, maxWidth: '220px' }}>
                India's trusted B2B travel network for professional travel agents.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 style={{ color: T.textPrimary, fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>Platform</h4>
              {['Package Studio', 'Booking Control', 'Analytics Dashboard', 'Agent Register'].map((item) => (
                <div key={item} style={{ marginBottom: '10px' }}>
                  <a href="/agent/login" style={{ color: T.textSecondary, fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = T.teal}
                    onMouseLeave={(e) => e.currentTarget.style.color = T.textSecondary}>
                    {item}
                  </a>
                </div>
              ))}
            </div>

            {/* Company */}
            <div>
              <h4 style={{ color: T.textPrimary, fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>Company</h4>
              {['About Us', 'Careers', 'Press & Media', 'Blog'].map((item) => (
                <div key={item} style={{ marginBottom: '10px' }}>
                  <a href="#" style={{ color: T.textSecondary, fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = T.teal}
                    onMouseLeave={(e) => e.currentTarget.style.color = T.textSecondary}>
                    {item}
                  </a>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ color: T.textPrimary, fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={14} style={{ color: T.teal, flexShrink: 0 }} />
                  <a href="mailto:agents@travelsphere.com" style={{ color: T.textSecondary, fontSize: '13px', textDecoration: 'none' }}>
                    agents@travelsphere.com
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={14} style={{ color: T.teal, flexShrink: 0 }} />
                  <a href="tel:+917992336832" style={{ color: T.textSecondary, fontSize: '13px', textDecoration: 'none' }}>
                    +91 7992 336 832
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Globe size={14} style={{ color: T.teal, flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ color: T.textSecondary, fontSize: '13px' }}>
                    Law Gate, Phagwara, Punjab, India
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: `1px solid rgba(255,255,255,0.06)`,
            paddingTop: '24px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
          }}>
            <p style={{ color: T.textSecondary, fontSize: '13px' }}>
              © 2026 TravelSphere. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['Privacy Policy', 'Terms of Service', 'Support'].map((item) => (
                <a key={item} href="#" style={{ color: T.textSecondary, fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = T.teal}
                  onMouseLeave={(e) => e.currentTarget.style.color = T.textSecondary}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════ LOGIN MODAL ════════════ */}
      <LoginModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
        /* Benefits section two-column grid collapses on mobile */
        @media (max-width: 900px) {
          .benefits-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </div>
  );
}

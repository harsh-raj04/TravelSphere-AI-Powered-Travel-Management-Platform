import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../services/api';
import { getImageUrl } from '../services/packageService';
import {
  MapPin, Calendar, Clock, Users, Star, ChevronRight, Search,
  X, CheckCircle, AlertCircle, Plane, Phone, Mail, Download,
  MessageSquare, RotateCcw, Filter, ArrowUpDown, Eye,
  CreditCard, Shield, Loader2, ExternalLink, Copy,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

const UPCOMING_STATUSES = new Set(['confirmed', 'open_for_agents', 'assigned', 'accepted', 'in_progress']);
const COMPLETED_STATUSES = new Set(['completed', 'closed']);

function getGroup(status) {
  if (UPCOMING_STATUSES.has(status)) return 'upcoming';
  if (COMPLETED_STATUSES.has(status)) return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'upcoming';
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function formatRef(id = '') {
  return `#TRV-${id.slice(-8).toUpperCase()}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateRange(travelDate, durationDays) {
  const start = new Date(travelDate);
  const end = new Date(start);
  end.setDate(end.getDate() + (durationDays ?? 1) - 1);
  const opts = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}, ${start.getFullYear()}`;
}

// ─── Star Rating ───────────────────────────────────────────────────────────

function Stars({ rating, max = 5, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              n <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Countdown Badge ───────────────────────────────────────────────────────

function CountdownBadge({ days }) {
  const color =
    days <= 7
      ? 'bg-red-500 text-white'
      : days <= 30
      ? 'bg-amber-500 text-white'
      : 'bg-teal-600 text-white';
  const pulse = days <= 7 ? 'animate-pulse' : '';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${color} ${pulse}`}>
      <Clock className="w-3.5 h-3.5" />
      {days <= 0 ? 'TODAY!' : `DEPARTING IN ${days} DAY${days !== 1 ? 'S' : ''}`}
    </span>
  );
}

// ─── Trip Checklist ────────────────────────────────────────────────────────

function TripChecklist({ booking }) {
  const checks = [
    { label: 'Booking Confirmed', done: true },
    { label: 'Payment Complete', done: !!booking.razorpayPaymentId },
    { label: 'Agent Assigned', done: !!booking.assignedAgent },
    { label: 'Ready to Travel', done: false },
  ];
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  return (
    <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Trip Preparation</span>
        <span className="text-xs font-bold text-teal-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.done
              ? <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            <span className={`text-xs ${c.done ? 'text-slate-600 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400'}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Upcoming Card ─────────────────────────────────────────────────────────

function UpcomingCard({ booking, onDetail }) {
  const days = daysUntil(booking.travelDate);
  const pkg = booking.package ?? {};
  const agent = booking.assignedAgent?.user;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={getImageUrl(pkg.bannerImage)}
          alt={pkg.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <CountdownBadge days={days} />
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-xs font-semibold text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-700">
            {pkg.category?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{pkg.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{pkg.destination}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDateRange(booking.travelDate, pkg.durationDays)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{pkg.durationDays} days</span>
            </div>
          </div>
        </div>

        <TripChecklist booking={booking} />

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{booking.travelersCount} Traveler{booking.travelersCount !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-400">₹{Number(booking.totalAmount).toLocaleString()}</span>
          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{formatRef(booking.id)}</span>
        </div>
        {agent && (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Agent: <span className="font-medium text-slate-600 dark:text-slate-300">{agent.name}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onDetail(booking)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" /> View Details
          </button>
          {agent && (
            <a
              href={`mailto:${agent.email}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          <Link
            to={`/packages/${booking.packageId}`}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Completed Card ────────────────────────────────────────────────────────

function CompletedCard({ booking, onFeedback, onDetail }) {
  const pkg = booking.package ?? {};
  const hasReview = !!booking.feedbackSubmittedAt;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={getImageUrl(pkg.bannerImage)}
          alt={pkg.title}
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-xs font-bold tracking-wide">
            COMPLETED
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          {hasReview && <Stars rating={booking.feedbackRating} />}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{pkg.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{pkg.destination}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDateRange(booking.travelDate, pkg.durationDays)}</span>
            </div>
          </div>
        </div>

        {/* Review section */}
        {hasReview ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Stars rating={booking.feedbackRating} />
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">{booking.feedbackRating}/5</span>
            </div>
            {booking.feedbackComment && (
              <p className="text-sm text-slate-700 dark:text-slate-300 italic line-clamp-2">"{booking.feedbackComment}"</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => onFeedback(booking)}
            className="w-full mb-4 p-3 border-2 border-dashed border-amber-300 dark:border-amber-600 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-center"
          >
            ⭐ How was your trip? Write a review
          </button>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{booking.travelersCount} Traveler{booking.travelersCount !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-400">₹{Number(booking.totalAmount).toLocaleString()}</span>
          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{formatRef(booking.id)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onDetail(booking)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4" /> View Details
          </button>
          <Link
            to={`/packages/${booking.packageId}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Book Again
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Cancelled Card ────────────────────────────────────────────────────────

function CancelledCard({ booking, onDetail }) {
  const pkg = booking.package ?? {};
  const refunded = booking.transaction?.status === 'refunded';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden opacity-80">
      <div className="relative h-40 overflow-hidden">
        <img
          src={getImageUrl(pkg.bannerImage)}
          alt={pkg.title}
          className="w-full h-full object-cover grayscale brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold tracking-wide">
            CANCELLED
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">{pkg.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{pkg.destination}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Was {formatDate(booking.travelDate)}</span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Amount paid: <strong className="text-slate-700 dark:text-slate-200">₹{Number(booking.totalAmount).toLocaleString()}</strong>
          </p>
          <p className="text-xs mt-1">
            Refund:{' '}
            {refunded ? (
              <span className="text-teal-600 font-medium">✓ Processed</span>
            ) : (
              <span className="text-amber-600 font-medium">May be in progress</span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onDetail(booking)}
            className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            View Details
          </button>
          <Link
            to="/packages"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Find Similar
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────

function EmptyState({ tab }) {
  const configs = {
    upcoming: {
      icon: '🧳',
      title: 'No Upcoming Adventures',
      sub: 'Your next journey awaits! Browse packages and start planning.',
      cta: 'Explore Packages',
      link: '/packages',
    },
    completed: {
      icon: '🗺️',
      title: 'No Completed Trips Yet',
      sub: 'Book your first trip today and start collecting memories!',
      cta: 'Browse Popular Packages',
      link: '/packages',
    },
    cancelled: {
      icon: '✈️',
      title: 'No Cancelled Bookings',
      sub: 'All your bookings are active. Great!',
      cta: null,
      link: null,
    },
    all: {
      icon: '🧭',
      title: "You Haven't Booked Yet",
      sub: 'Discover incredible destinations and book your first adventure.',
      cta: 'Explore Packages',
      link: '/packages',
    },
  };

  const c = configs[tab] ?? configs.all;
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">{c.icon}</div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{c.title}</h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">{c.sub}</p>
      {c.cta && (
        <Link
          to={c.link}
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
        >
          {c.cta} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────

function DetailModal({ booking, onClose }) {
  const [tab, setTab] = useState('overview');
  const pkg = booking.package ?? {};
  const agent = booking.assignedAgent?.user;
  const txn = booking.transaction;
  const [copied, setCopied] = useState(false);

  const copyRef = () => {
    navigator.clipboard.writeText(formatRef(booking.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'payment', label: 'Payment' },
    { id: 'support', label: 'Support' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header image */}
        <div className="relative h-40 overflow-hidden rounded-t-3xl sm:rounded-t-2xl shrink-0">
          <img src={getImageUrl(pkg.bannerImage)} alt={pkg.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-5 right-12">
            <h2 className="text-white font-bold text-xl leading-tight">{pkg.title}</h2>
            <p className="text-white/80 text-sm">{pkg.destination} · {formatDateRange(booking.travelDate, pkg.durationDays)}</p>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2 shrink-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {tab === 'overview' && (
            <>
              {/* Booking ref */}
              <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl">
                <div>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Booking Reference</p>
                  <p className="font-mono font-bold text-teal-800 dark:text-teal-300">{formatRef(booking.id)}</p>
                </div>
                <button onClick={copyRef} className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800 bg-white dark:bg-teal-900/50 border border-teal-200 dark:border-teal-700 px-3 py-1.5 rounded-lg transition-colors">
                  <Copy className="w-3.5 h-3.5" />{copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Info rows */}
              {[
                { label: 'Status', value: <StatusPill status={booking.status} /> },
                { label: 'Travel Date', value: formatDate(booking.travelDate) },
                { label: 'Duration', value: `${pkg.durationDays} days` },
                { label: 'Travelers', value: `${booking.travelersCount} person${booking.travelersCount !== 1 ? 's' : ''}` },
                { label: 'Destination', value: pkg.destination },
                { label: 'Booked On', value: formatDate(booking.bookingDate ?? booking.createdAt) },
                { label: 'Contact Email', value: booking.contactEmail },
                { label: 'Contact Phone', value: booking.contactPhone || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{value}</span>
                </div>
              ))}

              {booking.travelMessage && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Your Message</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{booking.travelMessage}"</p>
                </div>
              )}

              {agent && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {agent.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{agent.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your Travel Agent</p>
                  </div>
                  <a href={`mailto:${agent.email}`} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Mail className="w-4 h-4 text-teal-600" />
                  </a>
                </div>
              )}
            </>
          )}

          {tab === 'payment' && (
            <>
              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl">
                <p className="text-xs text-teal-600 dark:text-teal-400 mb-1">Total Paid</p>
                <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">₹{Number(booking.totalAmount).toLocaleString()}</p>
              </div>

              {[
                { label: 'Payment Status', value: txn?.status ? txn.status.charAt(0).toUpperCase() + txn.status.slice(1) : 'Completed' },
                { label: 'Payment Method', value: txn?.paymentMethod || 'Online' },
                { label: 'Transaction Ref', value: txn?.transactionReference || booking.razorpayPaymentId || '—' },
                { label: 'Order ID', value: booking.razorpayOrderId || '—' },
                { label: 'Travelers', value: booking.travelersCount },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">{value}</span>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 opacity-60 cursor-not-allowed">
                  <Download className="w-4 h-4" /> Download Receipt
                  <span className="text-xs text-amber-600 ml-1">(Soon)</span>
                </button>
              </div>
            </>
          )}

          {tab === 'support' && (
            <>
              {agent ? (
                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Your Travel Agent</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                      {agent.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{agent.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{agent.email}</p>
                    </div>
                  </div>
                  <a href={`mailto:${agent.email}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors">
                    <Mail className="w-4 h-4" /> Email Agent
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Agent will be assigned soon for this booking.</p>
                </div>
              )}

              <div className="space-y-2">
                <Link to="/support"
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-teal-400 transition-colors group">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Contact Support</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Open a support ticket</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                </Link>
                <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Modify Booking</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Request changes via support</p>
                    </div>
                  </div>
                  <span className="text-xs text-amber-600 font-medium">Coming Soon</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Pill ───────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const map = {
    confirmed:      { label: 'Confirmed',    cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
    open_for_agents:{ label: 'Confirmed',    cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
    assigned:       { label: 'Agent Assigned', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
    accepted:       { label: 'Accepted',     cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
    in_progress:    { label: 'Ongoing',      cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
    completed:      { label: 'Completed',    cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
    closed:         { label: 'Completed',    cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
    cancelled:      { label: 'Cancelled',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  };
  const cfg = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-700' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── Feedback Modal ────────────────────────────────────────────────────────

function FeedbackModal({ booking, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (comment.trim().length < 3) return;
    setSaving(true);
    try {
      await onSubmit(booking.id, { rating, comment });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Rate Your Trip</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <img src={getImageUrl(booking.package?.bannerImage)} alt="" className="w-14 h-14 rounded-xl object-cover" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {booking.package?.title || (booking.customRequest ? `Custom — ${booking.customRequest.destination}` : 'Custom Package')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {booking.package?.destination || booking.customRequest?.destination} · {formatDate(booking.travelDate)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">How would you rate this trip?</p>
            <div className="flex justify-center gap-2">
              <Stars rating={rating} onChange={setRating} />
            </div>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Share your experience</span>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you love about this trip? Any highlights or suggestions..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{comment.length} chars (min 3)</p>
          </label>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || comment.trim().length < 3}
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function Bookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [detailBooking, setDetailBooking] = useState(null);
  const [feedbackBooking, setFeedbackBooking] = useState(null);

  const load = async () => {
    try {
      const res = await bookingsAPI.myBookings();
      setItems(res.data?.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitFeedback = async (id, form) => {
    await bookingsAPI.submitFeedback(id, form);
    await load();
  };

  // Counts per tab
  const counts = useMemo(() => {
    const upcoming = items.filter((b) => getGroup(b.status) === 'upcoming').length;
    const completed = items.filter((b) => getGroup(b.status) === 'completed').length;
    const cancelled = items.filter((b) => getGroup(b.status) === 'cancelled').length;
    return { upcoming, completed, cancelled, all: items.length };
  }, [items]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = tab === 'all' ? items : items.filter((b) => getGroup(b.status) === tab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.package?.title?.toLowerCase().includes(q) ||
          b.package?.destination?.toLowerCase().includes(q) ||
          formatRef(b.id).toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sort === 'date') return new Date(a.travelDate) - new Date(b.travelDate);
      if (sort === 'amount') return Number(b.totalAmount) - Number(a.totalAmount);
      if (sort === 'name') return (a.package?.title ?? '').localeCompare(b.package?.title ?? '');
      return 0;
    });
  }, [items, tab, search, sort]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = items.filter((b) => getGroup(b.status) === 'upcoming');
    const thisYear = items.filter(
      (b) => b.status !== 'cancelled' && new Date(b.travelDate).getFullYear() === now.getFullYear()
    );
    const totalSpent = items
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    const nextTrip = upcoming
      .filter((b) => daysUntil(b.travelDate) >= 0)
      .sort((a, b) => new Date(a.travelDate) - new Date(b.travelDate))[0];
    const daysToNext = nextTrip ? daysUntil(nextTrip.travelDate) : null;

    return { upcomingCount: upcoming.length, thisYearCount: thisYear.length, totalSpent, daysToNext };
  }, [items]);

  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="travel-ui min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-1">My Trips</h1>
          <p className="text-teal-200">Track your adventures, past and upcoming</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Stats bar */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Upcoming Trips', value: stats.upcomingCount, icon: Plane, color: 'text-teal-600' },
              { label: 'This Year', value: stats.thisYearCount, icon: Calendar, color: 'text-blue-600' },
              { label: 'Total Spent', value: `₹${stats.totalSpent.toLocaleString()}`, icon: CreditCard, color: 'text-violet-600' },
              { label: 'Next Trip In', value: stats.daysToNext != null ? `${stats.daysToNext} days` : '—', icon: Clock, color: 'text-amber-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === id
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-teal-100 dark:hover:bg-slate-600'
                }`}
              >
                {label}
                {counts[id] > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'}`}>
                    {counts[id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search trips…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer"
              >
                <option value="date">By Date</option>
                <option value="amount">By Price</option>
                <option value="name">By Name</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading your trips…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid">
            <EmptyState tab={tab} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            {filtered.map((booking) => {
              const group = getGroup(booking.status);
              if (group === 'upcoming') return (
                <UpcomingCard key={booking.id} booking={booking} onDetail={setDetailBooking} />
              );
              if (group === 'completed') return (
                <CompletedCard key={booking.id} booking={booking} onFeedback={setFeedbackBooking} onDetail={setDetailBooking} />
              );
              return (
                <CancelledCard key={booking.id} booking={booking} onDetail={setDetailBooking} />
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {detailBooking && (
        <DetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />
      )}
      {feedbackBooking && (
        <FeedbackModal
          booking={feedbackBooking}
          onClose={() => setFeedbackBooking(null)}
          onSubmit={submitFeedback}
        />
      )}
    </div>
  );
}

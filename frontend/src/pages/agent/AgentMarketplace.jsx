import { useEffect, useState } from 'react';
import { agentAPI } from '../../services/api';
import {
  MapPin, Calendar, Users, IndianRupee, Clock, CheckCircle, Tag,
  ChevronDown, ChevronUp, Send, Briefcase, Star, AlertCircle, Zap,
} from 'lucide-react';
import { PageSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const TRIP_TYPE_LABELS = {
  adventure: 'Adventure',
  honeymoon: 'Honeymoon',
  family: 'Family',
  family_tours: 'Family',
  pilgrimage: 'Religious',
  religious: 'Religious',
  corporate: 'Corporate',
  solo: 'Solo',
  group: 'Group',
  beach: 'Beach',
  hill_station: 'Hill Station',
  wildlife: 'Wildlife',
  cultural: 'Cultural',
};

// ─── Status badge for agent's own application ────────────────────────────────
function AppStatusBadge({ status }) {
  const map = {
    applied:      { label: 'Applied — Pending',  variant: 'warning' },
    shortlisted:  { label: 'Shortlisted',        variant: 'info'    },
    selected:     { label: 'You Were Selected',  variant: 'success' },
    rejected:     { label: 'Not Selected',       variant: 'danger'  },
    withdrawn:    { label: 'Withdrawn',          variant: 'default' },
  };
  const cfg = map[status] || { label: status, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── Apply form inside a card ─────────────────────────────────────────────────
function ApplyForm({ bookingId, onApplied }) {
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [autoAssigned, setAutoAssigned] = useState(false);
  const addToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please write a short pitch.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await agentAPI.applyForTrip(bookingId, { message });
      const msg = res.data?.message || '';
      if (msg.toLowerCase().includes('automatically assigned')) {
        setAutoAssigned(true);
        addToast('You\'ve been auto-assigned to this booking!', 'success');
      }
      onApplied();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (autoAssigned) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 font-medium">
        <Zap className="w-4 h-4 text-emerald-600" />
        You were the first to apply — auto-assigned!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <textarea
        rows={3}
        placeholder="Tell the admin why you're the right agent for this trip..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Submitting…' : 'Submit Application'}
      </Button>
    </form>
  );
}

// ─── Single booking card ──────────────────────────────────────────────────────
function MarketplaceCard({ booking, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const isCustom = !booking.package && !!booking.customRequest;
  const cr = booking.customRequest;

  const title       = booking.package?.title  || (cr ? `Custom Trip — ${cr.destination}` : 'Custom Package');
  const destination = booking.package?.destination || cr?.destination || '—';
  const earnEstimate = booking.financials?.agent_payout;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-bold text-gray-900 truncate">{title}</h3>
              {isCustom && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Custom Request</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {destination}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {booking.travelersCount} traveler{booking.travelersCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Earning highlight */}
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">You earn</p>
            {earnEstimate && Number(booking.totalAmount) > 0
              ? <p className="text-lg font-bold text-emerald-600">{formatINR(earnEstimate)}</p>
              : <p className="text-sm font-semibold text-gray-400 italic">Quote pending</p>
            }
          </div>
        </div>

        {/* Application status or Apply prompt */}
        <div className="flex items-center justify-between">
          {booking.hasApplied ? (
            <AppStatusBadge status={booking.myApplication?.status} />
          ) : (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Not yet applied
            </span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium"
          >
            {expanded ? <><ChevronUp className="w-4 h-4" /> Less</> : <><ChevronDown className="w-4 h-4" /> Details</>}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
          {/* Financials */}
          {Number(booking.totalAmount) > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Trip Value</p>
                <p className="font-bold text-gray-900 text-sm">{formatINR(booking.financials?.total ?? booking.totalAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Platform (25%)</p>
                <p className="font-bold text-gray-900 text-sm">− {formatINR(booking.financials?.platform_commission)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">GST (5%)</p>
                <p className="font-bold text-gray-900 text-sm">− {formatINR(booking.financials?.gst)}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-emerald-600 mb-0.5">Your Payout</p>
                <p className="font-bold text-emerald-700 text-sm">{formatINR(earnEstimate)}</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              Price not yet set — admin will send a quote after agent assignment. Your payout will be calculated from the final quoted price.
            </div>
          )}

          {/* Custom request extra details */}
          {isCustom && cr && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Customer Requirements</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {cr.duration && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{cr.duration} days</span>
                  </div>
                )}
                {cr.adults != null && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>{cr.adults} adults{cr.children ? `, ${cr.children} children` : ''}</span>
                  </div>
                )}
                {cr.budget && !isNaN(Number(cr.budget)) && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <IndianRupee className="w-3.5 h-3.5 text-purple-400" />
                    <span>Budget: {formatINR(cr.budget)}</span>
                  </div>
                )}
                {cr.tripType && (
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    <span>{TRIP_TYPE_LABELS[cr.tripType] || cr.tripType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </div>
                )}
              </div>
              {cr.specialRequests && (
                <p className="text-xs text-gray-600 mt-1 italic">"{cr.specialRequests}"</p>
              )}
            </div>
          )}

          {/* Package details for standard bookings */}
          {!isCustom && booking.package && (
            <div className="text-sm text-gray-600 space-y-1">
              <p className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {booking.package.durationDays} days / {booking.package.durationNights} nights
              </p>
              {booking.package.highlights && (
                <p className="line-clamp-2 text-gray-500">{booking.package.highlights}</p>
              )}
            </div>
          )}

          {/* Already applied — show message */}
          {booking.hasApplied && booking.myApplication?.message && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Your pitch</p>
              <p className="text-sm text-blue-800 italic">"{booking.myApplication.message}"</p>
            </div>
          )}

          {/* Apply form */}
          {!booking.hasApplied && (
            <ApplyForm bookingId={booking.id} onApplied={onRefresh} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AgentMarketplace() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all'); // all | standard | custom | applied

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await agentAPI.marketplace();
      setItems(res.data?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((b) => {
    if (filter === 'standard') return !!b.package;
    if (filter === 'custom')   return !b.package && !!b.customRequest;
    if (filter === 'applied')  return b.hasApplied;
    return true;
  });

  const appliedCount  = items.filter((b) => b.hasApplied).length;
  const customCount   = items.filter((b) => !b.package && !!b.customRequest).length;
  const standardCount = items.filter((b) => !!b.package).length;

  const FILTERS = [
    { key: 'all',      label: `All (${items.length})` },
    { key: 'standard', label: `Standard (${standardCount})` },
    { key: 'custom',   label: `Custom (${customCount})` },
    { key: 'applied',  label: `Applied (${appliedCount})` },
  ];

  return (
    <div className="p-6 md:p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Booking Marketplace</h1>
        <p className="text-gray-500 text-sm">
          Browse open bookings — both standard packages and custom trip requests — and apply to fulfill them.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Briefcase,   label: 'Open Bookings', value: items.length,   color: 'blue'   },
          { icon: Star,        label: 'Standard',       value: standardCount,  color: 'indigo' },
          { icon: Tag,         label: 'Custom Trips',   value: customCount,    color: 'purple' },
          { icon: CheckCircle, label: 'Applied',        value: appliedCount,   color: 'green'  },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm`}>
            <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <PageSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No bookings found</p>
          <p className="text-sm mt-1">Check back soon — new trips appear here when customers book.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((booking) => (
            <MarketplaceCard key={booking.id} booking={booking} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}

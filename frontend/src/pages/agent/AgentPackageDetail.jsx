import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ColorfulCard } from '../../components/ui/ColorfulCard';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { packagesAPI, agentAPI } from '../../services/api';
import { getImageUrl } from '../../services/packageService';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Image,
  Clock,
  Tag,
  Loader2,
} from 'lucide-react';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const breakDown = (price) => {
  const total = Number(price || 0);
  const commission = Number((total * 0.25).toFixed(2));
  const gst = Number((total * 0.05).toFixed(2));
  const payout = Number((total - commission - gst).toFixed(2));
  return { total, commission, gst, payout };
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ packageData }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getImageUrl(packageData.bannerImage || packageData.imageUrl || packageData.image);

  return (
    <div className="space-y-6">
      {/* Hero Image */}
      {imageUrl && !imgError ? (
        <div className="rounded-xl overflow-hidden h-64">
          <img
            src={imageUrl}
            alt={packageData.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="rounded-xl h-64 bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
          <div className="text-center text-white/70">
            <Image className="w-12 h-12 mx-auto mb-2 opacity-60" />
            <p className="text-sm">{packageData.title}</p>
          </div>
        </div>
      )}

      {/* Title + Description */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{packageData.title}</h3>
        <p className="text-gray-700 text-base leading-relaxed">{packageData.description}</p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Destination</span>
          </div>
          <p className="font-semibold text-gray-900">{packageData.destination || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</span>
          </div>
          <p className="font-semibold text-gray-900">{packageData.durationDays} Days</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              packageData.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {packageData.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Category if present */}
      {packageData.category && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Category:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
            {packageData.category.replace(/_/g, ' ')}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Itinerary Tab ─────────────────────────────────────────────────────────────
function ItineraryTab({ packageData }) {
  const itineraries = packageData.itineraries;

  if (!itineraries || itineraries.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Itinerary</h3>
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No itinerary data available</p>
          <p className="text-sm mt-1">The itinerary for this package has not been added yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Itinerary <span className="text-base font-normal text-gray-500">({itineraries.length} days)</span>
      </h3>
      <div className="space-y-4">
        {itineraries.map((item, idx) => {
          const activities = Array.isArray(item.activities) ? item.activities : [];
          const locations = Array.isArray(item.locations) ? item.locations : [];
          const dayNum = item.dayNumber ?? idx + 1;

          return (
            <div
              key={item.id || idx}
              className="flex gap-4 bg-gradient-to-r from-teal-50 to-cyan-50 p-5 rounded-xl border border-teal-200"
            >
              {/* Day circle */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {dayNum}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">{item.title || `Day ${dayNum}`}</p>
                {item.description && (
                  <p className="text-gray-700 mt-1 text-sm leading-relaxed">{item.description}</p>
                )}
                {/* Time-of-day activities */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {item.morningActivity && (
                    <span className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1 rounded">
                      <strong>Morning:</strong> {item.morningActivity}
                    </span>
                  )}
                  {item.afternoonActivity && (
                    <span className="bg-orange-50 border border-orange-200 text-orange-800 px-2 py-1 rounded">
                      <strong>Afternoon:</strong> {item.afternoonActivity}
                    </span>
                  )}
                  {item.eveningActivity && (
                    <span className="bg-purple-50 border border-purple-200 text-purple-800 px-2 py-1 rounded">
                      <strong>Evening:</strong> {item.eveningActivity}
                    </span>
                  )}
                  {item.nightActivity && (
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-1 rounded">
                      <strong>Night:</strong> {item.nightActivity}
                    </span>
                  )}
                </div>
                {/* Locations */}
                {locations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {locations.map((loc, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3" />{loc}
                      </span>
                    ))}
                  </div>
                )}
                {/* Activities list */}
                {activities.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {activities.map((act, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                        {act}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inclusions Tab ─────────────────────────────────────────────────────────────
function InclusionsTab({ packageData }) {
  const all = packageData.inclusions || [];
  const items = all.filter((i) => i.type === 'inclusion');

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">What's Included</h3>
        <div className="text-center py-12 text-gray-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No inclusions listed</p>
          <p className="text-sm mt-1">Details about what's included will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Included</h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={item.id || idx}
            className="flex items-start gap-3 bg-green-50 border border-green-300 text-gray-800 px-4 py-3 rounded-lg"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
            <span className="text-sm leading-relaxed">{item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Exclusions Tab ─────────────────────────────────────────────────────────────
function ExclusionsTab({ packageData }) {
  const all = packageData.inclusions || [];
  const items = all.filter((i) => i.type === 'exclusion');

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">What's Not Included</h3>
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No exclusions listed</p>
          <p className="text-sm mt-1">Details about what's not included will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Not Included</h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={item.id || idx}
            className="flex items-start gap-3 bg-red-50 border border-red-300 text-gray-800 px-4 py-3 rounded-lg"
          >
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-500 font-bold text-xs leading-none">×</span>
            </div>
            <span className="text-sm leading-relaxed">{item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Terms Tab ─────────────────────────────────────────────────────────────────
function TermsTab({ packageData }) {
  const terms = packageData.terms || packageData.termsAndConditions || null;

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Terms &amp; Conditions</h3>
      {terms ? (
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
          {terms}
        </div>
      ) : (
        <div className="space-y-3 text-gray-700">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-900 mb-1">Cancellation Policy</p>
            <p className="text-sm">Free cancellation up to 7 days before travel. 50% refund for 7–3 days notice. No refund within 3 days of travel.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-900 mb-1">Rescheduling</p>
            <p className="text-sm">Customers can reschedule without charge up to 14 days before the travel date.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-900 mb-1">Agent Responsibility</p>
            <p className="text-sm">As the assigned agent, you are responsible for customer satisfaction and on-time service delivery.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-900 mb-1">Payment Terms</p>
            <p className="text-sm">Commission is paid after trip completion and customer satisfaction confirmation.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function AgentPackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const agentStatus = user?.agentProfile?.status || 'pending';
  const [packageData, setPackageData] = useState(null);
  const [payoutInfo, setPayoutInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [showOptModal, setShowOptModal] = useState(false);
  const [availability, setAvailability] = useState('available');
  const [optMessage, setOptMessage] = useState('');
  const [optingIn, setOptingIn] = useState(false);
  const [optingOut, setOptingOut] = useState(false);
  const [showOptOutConfirm, setShowOptOutConfirm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const loadPackageAndBooking = async () => {
    setLoading(true);
    setError('');
    try {
      // Use getDetails for full data (itineraries, inclusions, addOns, etc.)
      const pkgRes = await packagesAPI.getDetails(id);
      const pkg = pkgRes.data?.data || null;

      // Debug: log actual data shape to browser console
      console.log('Package data:', pkg);

      if (!pkg) {
        setError('Package not found');
        return;
      }
      setPackageData(pkg);

      // Check if user has already opted in
      try {
        const appsRes = await agentAPI.myPackageInterests();
        const hasApp = (appsRes.data?.data?.items || []).some(
          (app) => app.packageId === id || app.package?.id === id
        );
        setHasApplied(hasApp);
      } catch (_) {
        // Non-critical — continue without opt-in state
      }

      setPayoutInfo(breakDown(pkg.price));
    } catch (err) {
      console.error('Error loading:', err);
      setError(err?.response?.data?.message || 'Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackageAndBooking();
  }, [id]);

  const handleOptIn = async () => {
    if (!availability) {
      toast('Please select your availability', 'warning');
      return;
    }
    try {
      setOptingIn(true);
      await agentAPI.optInPackage(id, {
        availability,
        message:
          optMessage ||
          (availability === 'available'
            ? 'I am available and willing to take this package'
            : availability === 'maybe'
            ? 'I am tentatively available for this package'
            : 'I am currently busy for this package'),
      });
      setHasApplied(true);
      setShowOptModal(false);
      toast('Successfully opted in! Waiting for admin confirmation.', 'success');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to opt in');
    } finally {
      setOptingIn(false);
    }
  };

  const handleOptOut = async () => {
    setShowOptOutConfirm(false);
    setOptingOut(true);
    try {
      await agentAPI.optOutPackage(id);
      setHasApplied(false);
      toast('You have opted out of this package.', 'info');
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to opt out. Please try again.', 'error');
    } finally {
      setOptingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="p-8">
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
          {error || 'Package not found'}
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'inclusions', label: 'Inclusions', icon: CheckCircle2 },
    { id: 'exclusions', label: 'Exclusions', icon: AlertCircle },
    { id: 'terms', label: 'Terms', icon: BookOpen },
  ];

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(-1)} variant="ghost" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{packageData.title}</h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" />
              {packageData.destination || 'Destination not set'}
            </p>
          </div>
        </div>
        {hasApplied && (
          <Badge variant="success" className="px-4 py-2">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            You've Applied
          </Badge>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Calendar} label="Duration" value={`${packageData.durationDays} Days`} variant="blue" />
        <StatCard icon={IndianRupee} label="Package Price" value={formatINR(packageData.price)} variant="green" />
        {payoutInfo && (
          <>
            <StatCard icon={Users} label="Your Payout" value={formatINR(payoutInfo.payout)} variant="purple" />
            <StatCard
              icon={CheckCircle2}
              label="Admin Margin"
              value={formatINR(payoutInfo.commission + payoutInfo.gst)}
              variant="orange"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-4 font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ColorfulCard variant="light">
            {activeTab === 'overview' && <OverviewTab packageData={packageData} />}
            {activeTab === 'itinerary' && <ItineraryTab packageData={packageData} />}
            {activeTab === 'inclusions' && <InclusionsTab packageData={packageData} />}
            {activeTab === 'exclusions' && <ExclusionsTab packageData={packageData} />}
            {activeTab === 'terms' && <TermsTab packageData={packageData} />}
          </ColorfulCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Breakdown */}
          {payoutInfo && (
            <ColorfulCard variant="purple">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-purple-600" />
                Your Earnings
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                  <span className="text-gray-700">Package Price</span>
                  <span className="font-semibold">{formatINR(payoutInfo.total)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                  <span className="text-gray-700">Admin Commission (25% + 5% GST)</span>
                  <span className="font-semibold">-{formatINR(payoutInfo.commission + payoutInfo.gst)}</span>
                </div>
                <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg mt-3">
                  <span className="font-bold text-gray-900">Your Payout</span>
                  <span className="text-2xl font-bold text-purple-600">{formatINR(payoutInfo.payout)}</span>
                </div>
              </div>
            </ColorfulCard>
          )}

          {/* Opt-in Section */}
          {agentStatus !== 'active' ? (
            <ColorfulCard variant="light">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Account Pending Approval</h3>
              <p className="text-sm text-gray-600">
                Your agent account is under review. You can opt in to packages once an admin approves your account.
              </p>
            </ColorfulCard>
          ) : !hasApplied ? (
            <ColorfulCard variant="green">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Interested?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Mark your availability to receive bookings for this package
              </p>
              <Button
                onClick={() => setShowOptModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
              >
                Opt In Now
              </Button>
            </ColorfulCard>
          ) : (
            <ColorfulCard variant="green">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold">You've Opted In</p>
                    <p className="text-sm text-green-600">Waiting for admin to assign a booking</p>
                  </div>
                </div>
                {!showOptOutConfirm && (
                  <Button
                    onClick={() => setShowOptOutConfirm(true)}
                    disabled={optingOut}
                    className="text-xs px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex-shrink-0 font-medium"
                  >
                    Opt Out
                  </Button>
                )}
              </div>

              {showOptOutConfirm && (
                <div className="mt-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Confirm opt out?</p>
                  <p className="text-xs text-gray-600 mb-3">
                    You will stop receiving future bookings for this package. Any active bookings already assigned to you are unaffected.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleOptOut}
                      disabled={optingOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      {optingOut && <Loader2 className="w-3 h-3 animate-spin" />}
                      Yes, Opt Out
                    </Button>
                    <Button
                      onClick={() => setShowOptOutConfirm(false)}
                      disabled={optingOut}
                      className="px-3 py-1.5 text-xs bg-gray-700 text-white hover:bg-gray-600 rounded-lg font-medium"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </ColorfulCard>
          )}

          {/* Package Info Card */}
          <ColorfulCard variant="blue">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Package Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Destination</p>
                <p className="font-semibold text-gray-900">{packageData.destination || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-semibold text-gray-900">{packageData.durationDays} Days</p>
              </div>
              {packageData.category && (
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {packageData.category.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Status</p>
                <Badge variant={packageData.isActive ? 'success' : 'error'}>
                  {packageData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {/* Pricing options if available */}
              {packageData.pricingOptions && packageData.pricingOptions.length > 0 && (
                <div>
                  <p className="text-gray-600 mb-1">Pricing Options</p>
                  <div className="space-y-1">
                    {packageData.pricingOptions.map((opt, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="capitalize text-gray-700">{opt.roomType}</span>
                        <span className="font-semibold text-gray-900">{formatINR(opt.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ColorfulCard>

          {/* Add-ons if available */}
          {packageData.addOns && packageData.addOns.length > 0 && (
            <ColorfulCard variant="orange">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Available Add-ons</h3>
              <div className="space-y-2">
                {packageData.addOns.map((ao, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ao.title}</p>
                      {ao.description && (
                        <p className="text-xs text-gray-600">{ao.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0">
                      +{formatINR(ao.price)}
                    </span>
                  </div>
                ))}
              </div>
            </ColorfulCard>
          )}
        </div>
      </div>

      {/* Opt-in Modal */}
      <Modal
        isOpen={showOptModal}
        title="Select Your Availability"
        onClose={() => setShowOptModal(false)}
        size="md"
        actions={[
          <Button key="cancel" variant="outline" onClick={() => setShowOptModal(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            onClick={handleOptIn}
            disabled={optingIn}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {optingIn ? 'Opting In...' : 'Confirm Opt In'}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <p className="text-gray-700 text-center mb-6">How available are you for this package?</p>
          {[
            {
              value: 'available',
              label: 'Available',
              desc: 'I can take this booking immediately',
              color: 'from-green-500 to-emerald-600',
            },
            {
              value: 'maybe',
              label: 'Maybe',
              desc: 'Possibly available - confirm later',
              color: 'from-yellow-500 to-orange-600',
            },
            {
              value: 'busy',
              label: 'Busy',
              desc: 'Not available right now',
              color: 'from-red-500 to-pink-600',
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all block ${
                availability === option.value
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  value={option.value}
                  checked={availability === option.value}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-4 h-4 accent-teal-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </div>
              </div>
            </label>
          ))}
          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-2">
              Message to Admin
            </label>
            <textarea
              value={optMessage}
              onChange={(e) => setOptMessage(e.target.value)}
              placeholder="Add anything helpful about your availability or experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={4}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ColorfulCard } from '../../components/ui/ColorfulCard';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { packagesAPI, agentAPI } from '../../services/api';
import { ArrowLeft, MapPin, Calendar, Users, IndianRupee, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const breakDown = (price) => {
  const total = Number(price || 0);
  const commission = Number((total * 0.25).toFixed(2));
  const gst = Number((total * 0.05).toFixed(2));
  const payout = Number((total - commission - gst).toFixed(2));

  return { total, commission, gst, payout };
};

export function AgentPackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [booking, setBooking] = useState(null);
  const [payoutInfo, setPayoutInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [showOptModal, setShowOptModal] = useState(false);
  const [availability, setAvailability] = useState('available');
  const [optMessage, setOptMessage] = useState('');
  const [optingIn, setOptingIn] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const loadPackageAndBooking = async () => {
    setLoading(true);
    setError('');
    try {
      // Load package
      const pkgRes = await packagesAPI.getById(id);
      const pkg = pkgRes.data?.data || null;
      if (!pkg) {
        setError('Package not found');
        return;
      }
      setPackageData(pkg);

      // Check if user has already applied
      const appsRes = await agentAPI.myPackageInterests();
      const hasApp = (appsRes.data?.data?.items || []).some((app) => app.packageId === id || app.package?.id === id);
      setHasApplied(hasApp);

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
      alert('Please select your availability');
      return;
    }

    try {
      setOptingIn(true);
      await agentAPI.optInPackage(id, {
        availability,
        message: optMessage || (
          availability === 'available'
            ? 'I am available and willing to take this package'
            : availability === 'maybe'
            ? 'I am tentatively available for this package'
            : 'I am currently busy for this package'
        ),
      });

      setHasApplied(true);
      setShowOptModal(false);
      alert('Successfully opted in! Waiting for admin confirmation.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to opt in');
    } finally {
      setOptingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
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
              {packageData.destination}
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
            <StatCard icon={CheckCircle2} label="Admin Margin" value={formatINR(payoutInfo.commission + payoutInfo.gst)} variant="orange" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'itinerary', label: 'Itinerary' },
            { id: 'inclusions', label: 'Inclusions' },
            { id: 'exclusions', label: 'Exclusions' },
            { id: 'terms', label: 'Terms' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">Package Overview</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{packageData.description}</p>
                {packageData.imageUrls && packageData.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {packageData.imageUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Package ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Itinerary</h3>
                {packageData.itinerary ? (
                  <div className="space-y-4">
                    {typeof packageData.itinerary === 'string'
                      ? <p className="text-gray-700 whitespace-pre-wrap">{packageData.itinerary}</p>
                      : Array.isArray(packageData.itinerary)
                      ? packageData.itinerary.map((item, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <p className="font-semibold text-gray-900">Day {idx + 1}</p>
                            <p className="text-gray-700 mt-1">{item}</p>
                          </div>
                        ))
                      : <p className="text-gray-700">{JSON.stringify(packageData.itinerary, null, 2)}</p>
                    }
                  </div>
                ) : (
                  <p className="text-gray-600">No itinerary information provided</p>
                )}
              </div>
            )}

            {activeTab === 'inclusions' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Included</h3>
                <ul className="space-y-2">
                  {['Accommodation', 'Meals (breakfast & dinner)', 'Transportation', 'Guided tours', 'Insurance coverage'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'exclusions' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Excluded</h3>
                <ul className="space-y-2">
                  {['Personal expenses', 'Tips & gratuities', 'Travel insurance', 'Adventure activities (optional)', 'Alcohol & beverages'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-500 font-bold">×</span>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Terms & Conditions</h3>
                <div className="space-y-3 text-gray-700">
                  <p><strong>Cancellation Policy:</strong> Free cancellation up to 7 days before travel. 50% refund for 7-3 days notice. No refund within 3 days.</p>
                  <p><strong>Rescheduling:</strong> Customers can reschedule without charge up to 14 days before the travel date.</p>
                  <p><strong>Agent Responsibility:</strong> As the assigned agent, you are responsible for customer satisfaction and on-time service delivery.</p>
                  <p><strong>Payment Terms:</strong> Commission is paid after trip completion and customer satisfaction confirmation.</p>
                </div>
              </div>
            )}
          </ColorfulCard>
        </div>

        {/* Sidebar - Payment & Opt-in */}
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
                  <span className="font-semibold">{formatINR(payoutInfo.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                  <span className="text-gray-700">Admin Commission</span>
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
          {!hasApplied ? (
            <ColorfulCard variant="green">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Interested?</h3>
              <p className="text-sm text-gray-600 mb-4">Mark your availability to receive bookings for this package</p>
              <Button
                onClick={() => setShowOptModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
              >
                Opt In Now
              </Button>
            </ColorfulCard>
          ) : (
            <ColorfulCard variant="green">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <p className="font-bold">You've Opted In</p>
                  <p className="text-sm">Waiting for admin to assign a booking</p>
                </div>
              </div>
            </ColorfulCard>
          )}

          {/* Package Info Card */}
          <ColorfulCard variant="blue">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Package Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Destination</p>
                <p className="font-semibold text-gray-900">{packageData.destination}</p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-semibold text-gray-900">{packageData.durationDays} Days</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <Badge variant={packageData.isActive ? 'success' : 'error'}>
                  {packageData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </ColorfulCard>
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
            { value: 'available', label: 'Available', desc: 'I can take this booking immediately', color: 'from-green-500 to-emerald-600' },
            { value: 'maybe', label: 'Maybe', desc: 'Possibly available - confirm later', color: 'from-yellow-500 to-orange-600' },
            { value: 'busy', label: 'Busy', desc: 'Not available right now', color: 'from-red-500 to-pink-600' },
          ].map((option) => (
            <label
              key={option.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                availability === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  value={option.value}
                  checked={availability === option.value}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </div>
              </div>
            </label>
          ))}
          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-2">Message to Admin</label>
            <textarea
              value={optMessage}
              onChange={(e) => setOptMessage(e.target.value)}
              placeholder="Add anything helpful about your availability or experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

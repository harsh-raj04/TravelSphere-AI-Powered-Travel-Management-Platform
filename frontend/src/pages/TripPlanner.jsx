import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Send, User, Plus, MessageSquare, Copy, ThumbsUp, ThumbsDown,
  MapPin, ChevronRight, Menu, X, RotateCcw, Compass,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI, packagesAPI, paymentAPI, customRequestsAPI } from '../services/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

const SUGGESTIONS = [
  'Plan a 7-day trip to Kashmir in summer',
  'Best hill stations near Delhi for a long weekend',
  'Budget honeymoon in Kerala — 5 nights',
  'Backpacking Himachal Pradesh — complete guide',
  'Rajasthan royal circuit — 10 days luxury',
  'Leh Ladakh road trip from Manali — itinerary',
];

function genSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isItineraryResponse(content) {
  return /##\s*Day\s*\d/i.test(content) || /Day\s*\d\s*[—-]/i.test(content);
}

function extractDestination(userMessage) {
  const patterns = [
    /(?:trip|travel|visit|itinerary|plan)\s+(?:to|in|for)\s+([A-Za-z]+(?:\s[A-Za-z]+)?)/i,
    /([A-Za-z]+(?:\s[A-Za-z]+)?)\s+(?:\d+[\s-]*day|trip|itinerary|tour)/i,
    /(?:go(?:ing)? to|explore|plan)\s+([A-Za-z]+(?:\s[A-Za-z]+)?)/i,
  ];
  for (const p of patterns) {
    const m = userMessage.match(p);
    if (m?.[1] && m[1].length > 2) return m[1].trim();
  }
  return null;
}

// Known Indian destinations for fallback extraction
const KNOWN_DESTINATIONS = [
  'Leh Ladakh', 'Ladakh', 'Kashmir', 'Goa', 'Kerala', 'Rajasthan',
  'Manali', 'Shimla', 'Himachal', 'Rishikesh', 'Uttarakhand',
  'Andaman', 'Coorg', 'Ooty', 'Munnar', 'Jaipur', 'Agra', 'Varanasi',
  'Darjeeling', 'Sikkim', 'Meghalaya', 'Spiti', 'Kedarnath', 'Char Dham',
];

// Parse packages:display and custom:request blocks from AI response
function parseAIResponse(content) {
  let packageQuery = null;
  let customRequestTrigger = null;
  let cleanContent = content;
  let match;

  // packages:display block (new format)
  const pkgRegex = /```packages:display\s*([\s\S]*?)```/g;
  while ((match = pkgRegex.exec(content)) !== null) {
    try {
      packageQuery = JSON.parse(match[1].trim());
      cleanContent = cleanContent.replace(match[0], '').trim();
    } catch {}
  }

  // custom:request block
  const crRegex = /```custom:request\s*([\s\S]*?)```/g;
  while ((match = crRegex.exec(content)) !== null) {
    try {
      customRequestTrigger = JSON.parse(match[1].trim());
      cleanContent = cleanContent.replace(match[0], '').trim();
    } catch {}
  }

  // Legacy fallback: [SHOW_PACKAGES:{...}]
  if (!packageQuery) {
    const legacyRegex = /\[SHOW_PACKAGES:\s*(\{[\s\S]*?\})\]/g;
    while ((match = legacyRegex.exec(content)) !== null) {
      try {
        packageQuery = JSON.parse(match[1]);
        cleanContent = cleanContent.replace(match[0], '').trim();
      } catch {}
    }
  }

  return { cleanContent, packageQuery, customRequestTrigger };
}

// Strip all AI display blocks during streaming so they don't flash as raw text
function stripTagsForDisplay(content) {
  let out = content
    .replace(/```packages:display[\s\S]*?```/g, '')
    .replace(/```custom:request[\s\S]*?```/g, '')
    .replace(/\[SHOW_PACKAGES:\s*\{[\s\S]*?\}\]/g, '');
  // Hide partial blocks still being streamed (opening fence, no closing fence yet)
  out = out.replace(/```packages:display[\s\S]*$/, '');
  out = out.replace(/```custom:request[\s\S]*$/, '');
  out = out.replace(/\[SHOW_PACKAGES:[\s\S]*$/, '');
  return out.trim();
}

// Fallback: extract destination from AI response text
function extractDestinationFromText(text) {
  for (const dest of KNOWN_DESTINATIONS) {
    if (text.toLowerCase().includes(dest.toLowerCase())) return dest;
  }
  return null;
}

// Detect if user message is a package-browsing query
function isPackageBrowseQuery(msg) {
  return /show\s*(me\s*)?(packages?|trips?|deals?|options?)|packages?\s*for|i\s*want\s*to\s*book|best\s*(packages?|deals?)|browse\s*packages?/i.test(msg);
}

const ITINERARY_QUICK_REPLIES = [
  '📦 View matching packages',
  '✨ Request Custom Trip',
  'Customize this itinerary',
  'What to pack?',
];
const DEFAULT_QUICK_REPLIES = [
  'Plan a detailed itinerary',
  '✨ Request Custom Trip',
  'Best destinations in India',
  'Travel tips for beginners',
];

// ─── Booking Widget ────────────────────────────────────────────────────────────
function BookingWidget({ pkg, user, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(user ? 1 : 0);
  const [loadingDetails, setLoadingDetails] = useState(!!user);
  const [departures, setDepartures] = useState([]);
  const [pricingOptions, setPricingOptions] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [travelers, setTravelers] = useState(2);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Razorpay script
  useEffect(() => {
    if (!document.getElementById('razorpay-script')) {
      const s = document.createElement('script');
      s.id = 'razorpay-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  // Fetch departures + pricing options
  useEffect(() => {
    if (!user) return;
    setLoadingDetails(true);
    packagesAPI.getDetails(pkg.id)
      .then(res => {
        const data = res.data?.data || {};
        const now = new Date();
        const upcoming = (data.departures || []).filter(d =>
          d.isActive &&
          new Date(d.departureDate) > now &&
          (d.availableSeats == null || d.availableSeats - (d.bookedSeats || 0) > 0)
        );
        setDepartures(upcoming);
        const opts = data.pricingOptions || [];
        setPricingOptions(opts);
        if (opts.length > 0) setSelectedRoom(opts[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingDetails(false));
  }, [pkg.id, user]);

  const hasPricingOptions = pricingOptions.length > 0;
  const roomPrice = selectedRoom ? Number(selectedRoom.price) : Number(pkg.price || 0);
  const totalPrice = roomPrice * travelers;
  // Step numbers: 1=departure, 2=room(if opts), 3=contact, 4=review (shifts by 1 when no room step)
  const contactStep = hasPricingOptions ? 3 : 2;
  const reviewStep = hasPricingOptions ? 4 : 3;
  const totalSteps = hasPricingOptions ? 4 : 3;

  const stepLabel = (s) => {
    const labels = hasPricingOptions
      ? { 1: 'Choose Departure', 2: 'Room Type', 3: 'Your Details', 4: 'Review & Pay' }
      : { 1: 'Choose Departure', 2: 'Your Details', 3: 'Review & Pay' };
    return `Step ${s} of ${totalSteps} · ${labels[s] || ''}`;
  };

  async function initiatePayment() {
    if (!selectedDeparture) { setError('Please select a departure.'); return; }
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }
    setLoading(true);
    setError('');
    try {
      const orderRes = await paymentAPI.createOrder({
        package_id: pkg.id,
        departure_id: selectedDeparture.id,
        room_type: selectedRoom?.roomType || 'standard',
        room_price: roomPrice,
        travelers,
        travel_date: selectedDeparture.departureDate,
        departure_date: selectedDeparture.departureDate,
        add_on_ids: [],
      });
      const { key_id, order_id, amount, currency, booking_details } = orderRes.data.data;
      const options = {
        key: key_id,
        amount: Number(amount),
        currency: currency || 'INR',
        name: 'TravelSphere',
        description: `${pkg.title} — ${travelers} traveler${travelers > 1 ? 's' : ''}`,
        order_id,
        prefill: { name, email },
        theme: { color: '#0F766E' },
        handler: async (response) => {
          try {
            await paymentAPI.verify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              booking_details,
            });
            onSuccess('booking');
          } catch {
            setError('Payment received but confirmation failed. Please contact support.');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => { setError('Payment was cancelled.'); setLoading(false); },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', () => { setError('Payment failed. Please try again.'); setLoading(false); });
    } catch (e) {
      setError(e?.response?.data?.message || 'Payment initiation failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
        {pkg.bannerImage && (
          <img src={`${BACKEND_URL}${pkg.bannerImage}`} alt={pkg.title}
            className="w-12 h-9 object-cover rounded-lg flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{pkg.title}</p>
          <p className="text-xs text-gray-500">{pkg.durationDays} days · {pkg.destination}</p>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        {/* Not logged in */}
        {step === 0 && (
          <div className="text-center py-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Sign in to book this trip</p>
            <p className="text-xs text-gray-500 mb-4">Create a free account to book packages and manage your trips.</p>
            <a href="/login"
              className="inline-block px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition">
              Sign In / Register
            </a>
          </div>
        )}

        {/* Loading departures */}
        {step >= 1 && loadingDetails && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading availability…</span>
          </div>
        )}

        {/* No upcoming departures */}
        {step >= 1 && !loadingDetails && departures.length === 0 && (
          <div className="text-center py-5">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-sm font-semibold text-gray-700 mb-1">No upcoming departures</p>
            <p className="text-xs text-gray-500 mb-4">All seats are filled or no dates are scheduled. Visit the package page to request custom dates.</p>
            <button onClick={() => navigate(`/packages/${pkg.id}`)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition">
              View Package Page →
            </button>
          </div>
        )}

        {/* Step 1: Choose departure + travelers */}
        {step === 1 && !loadingDetails && departures.length > 0 && (
          <>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">{stepLabel(1)}</p>

            <p className="text-xs font-medium text-gray-600 mb-2">Select Departure Date <span className="text-red-400">*</span></p>
            <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto pr-1">
              {departures.map(dep => {
                const seats = dep.availableSeats != null ? dep.availableSeats - (dep.bookedSeats || 0) : null;
                const isSelected = selectedDeparture?.id === dep.id;
                return (
                  <button key={dep.id} onClick={() => setSelectedDeparture(dep)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition ${
                      isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(dep.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {dep.price && (
                          <p className="text-xs text-emerald-600 font-medium">₹{Number(dep.price).toLocaleString('en-IN')}/person</p>
                        )}
                      </div>
                      <div className="text-right">
                        {seats != null && (
                          <p className={`text-xs font-medium ${seats <= 5 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {seats} seat{seats !== 1 ? 's' : ''} left
                          </p>
                        )}
                        {isSelected && <span className="text-emerald-600 text-xs font-bold">✓ Selected</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-medium text-gray-600 mb-2">Number of Travelers <span className="text-red-400">*</span></p>
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setTravelers(t => Math.max(1, t - 1))}
                className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-400 hover:text-emerald-600 font-bold transition">−</button>
              <span className="text-2xl font-bold text-gray-900 w-10 text-center">{travelers}</span>
              <button onClick={() => {
                  const max = selectedDeparture?.availableSeats != null
                    ? selectedDeparture.availableSeats - (selectedDeparture.bookedSeats || 0)
                    : 20;
                  setTravelers(t => Math.min(max, t + 1));
                }}
                className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-400 hover:text-emerald-600 font-bold transition">+</button>
              <span className="text-xs text-gray-400 ml-1">person{travelers > 1 ? 's' : ''}</span>
            </div>

            {error && <p className="text-xs text-red-500 mb-2">⚠ {error}</p>}
            <button onClick={() => {
                if (!selectedDeparture) { setError('Please select a departure date.'); return; }
                setError('');
                setStep(hasPricingOptions ? 2 : contactStep);
              }}
              disabled={!selectedDeparture}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition">
              {hasPricingOptions ? 'Next: Room Type →' : 'Next: Your Details →'}
            </button>
          </>
        )}

        {/* Step 2: Room type (only if pricingOptions exist) */}
        {step === 2 && hasPricingOptions && !loadingDetails && (
          <>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">{stepLabel(2)}</p>
            <p className="text-xs font-medium text-gray-600 mb-2">Select Room Type <span className="text-red-400">*</span></p>
            <div className="space-y-2 mb-4">
              {pricingOptions.map(opt => {
                const isSelected = selectedRoom?.roomType === opt.roomType;
                return (
                  <button key={opt.id || opt.roomType} onClick={() => setSelectedRoom(opt)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition ${
                      isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
                    }`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 capitalize">{opt.roomType.replace(/_/g, ' ')}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-emerald-700">₹{Number(opt.price).toLocaleString('en-IN')}<span className="text-xs font-normal text-gray-400">/person</span></p>
                        {isSelected && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {error && <p className="text-xs text-red-500 mb-2">⚠ {error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
                ← Back
              </button>
              <button onClick={() => {
                  if (!selectedRoom) { setError('Please select a room type.'); return; }
                  setError(''); setStep(contactStep);
                }}
                disabled={!selectedRoom}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition">
                Next: Your Details →
              </button>
            </div>
          </>
        )}

        {/* Contact details step */}
        {step === contactStep && !loadingDetails && departures.length > 0 && (
          <>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">{stepLabel(contactStep)}</p>

            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-300" />

            <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-400">*</span></label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-300" />

            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+91 99999 99999"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-300" />

            {error && <p className="text-xs text-red-500 mb-2">⚠ {error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep(hasPricingOptions ? 2 : 1)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
                ← Back
              </button>
              <button onClick={() => {
                  if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }
                  setError(''); setStep(reviewStep);
                }}
                disabled={!name.trim() || !email.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition">
                Review Booking →
              </button>
            </div>
          </>
        )}

        {/* Review & Pay */}
        {step === reviewStep && !loadingDetails && (
          <>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">{stepLabel(reviewStep)}</p>

            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Package</span>
                <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{pkg.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Departure</span>
                <span className="font-medium text-gray-900">
                  {selectedDeparture && new Date(selectedDeparture.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {selectedRoom && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Room</span>
                  <span className="font-medium text-gray-900 capitalize">{selectedRoom.roomType.replace(/_/g, ' ')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Travelers</span>
                <span className="font-medium text-gray-900">{travelers} person{travelers > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{email}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 flex justify-between items-baseline">
                <span className="text-gray-700 font-semibold text-sm">Total</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-emerald-700">₹{totalPrice.toLocaleString('en-IN')}</span>
                  <p className="text-xs text-gray-400">₹{roomPrice.toLocaleString('en-IN')} × {travelers}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Secure payment via Razorpay · GST may apply</p>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">⚠ {error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setStep(contactStep)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
                ← Edit
              </button>
              <button onClick={initiatePayment} disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition">
                {loading ? 'Processing…' : '🔒 Pay & Confirm'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Custom Request Form (8-step) ─────────────────────────────────────────────
const INTEREST_OPTIONS = [
  { icon: '🏔️', label: 'Adventure' },
  { icon: '😌', label: 'Relaxation' },
  { icon: '🎭', label: 'Culture' },
  { icon: '🦁', label: 'Wildlife' },
  { icon: '🏖️', label: 'Beaches' },
  { icon: '⛰️', label: 'Mountains' },
  { icon: '🕉️', label: 'Spiritual' },
  { icon: '🍽️', label: 'Food & Culinary' },
];
const BUDGET_OPTIONS = [
  { label: '₹10,000 – ₹25,000', value: '10000-25000' },
  { label: '₹25,000 – ₹50,000', value: '25000-50000' },
  { label: '₹50,000 – ₹1,00,000', value: '50000-100000' },
  { label: 'Above ₹1,00,000', value: '100000+' },
];
const ACCOMMODATION_OPTIONS = [
  { icon: '🏠', label: 'Budget', desc: 'Hostels, guesthouses' },
  { icon: '🏨', label: 'Mid-range', desc: '3-star hotels' },
  { icon: '✨', label: 'Premium', desc: '4-star hotels' },
  { icon: '💎', label: 'Luxury', desc: '5-star resorts' },
];
const FORM_STEPS = ['destination', 'duration', 'budget', 'travelers', 'interests', 'activities', 'accommodation', 'contact'];

function CustomRequestForm({ trigger, user, onClose, onSuccess }) {
  const getInitialStep = () => {
    if (!user) return 'login';
    if (trigger?.destination) return 'duration';
    return 'destination';
  };

  const [step, setStep] = useState(getInitialStep);
  const [form, setForm] = useState({
    destination: trigger?.destination || '',
    duration: null,
    budget: '',
    adults: 2,
    children: 0,
    interests: [],
    activities: '',
    accommodation: '',
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const progressSteps = trigger?.destination
    ? FORM_STEPS.filter(s => s !== 'destination')
    : FORM_STEPS;
  const currentIdx = progressSteps.indexOf(step);
  const progress = currentIdx >= 0
    ? Math.round(((currentIdx + 1) / progressSteps.length) * 100)
    : 0;

  function nextStep(current) {
    const idx = progressSteps.indexOf(current);
    if (idx < progressSteps.length - 1) setStep(progressSteps[idx + 1]);
  }

  function prevStep(current) {
    const idx = progressSteps.indexOf(current);
    if (idx > 0) setStep(progressSteps[idx - 1]);
  }

  function toggleInterest(label) {
    set('interests', form.interests.includes(label)
      ? form.interests.filter(i => i !== label)
      : [...form.interests, label]);
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const budgetParts = form.budget.split('-');
      await customRequestsAPI.submit({
        name:            form.name.trim(),
        email:           form.email.trim(),
        phone:           form.phone.trim() || undefined,
        destination:     form.destination.trim(),
        duration:        form.duration || undefined,
        adults:          form.adults,
        children:        form.children,
        budget:          form.budget || undefined,
        accommodation:   form.accommodation || undefined,
        interests:       form.interests.length ? form.interests : undefined,
        specialRequests: form.activities.trim() || undefined,
      });
      setSubmitted(true);
      onSuccess?.('custom_request');
    } catch (e) {
      setError(e?.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 transition';
  const btnPrimary = 'w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition';
  const btnBack = 'flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition';

  return (
    <div className="bg-white border border-teal-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
        <div>
          <p className="font-bold text-gray-900 text-sm">🎨 Custom Trip Request</p>
          <p className="text-xs text-gray-500">Tell us your preferences — we'll design the perfect trip</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {!['login', 'destination'].includes(step) && !submitted && (
        <div className="px-4 pt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Step {currentIdx + 1} of {progressSteps.length}</p>
        </div>
      )}

      <div className="p-4">

        {/* ── Login gate ── */}
        {step === 'login' && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Sign in to submit your request</p>
            <p className="text-xs text-gray-500 mb-4">Create a free account to track your custom trip requests.</p>
            <a href="/login"
              className="inline-block px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition">
              Sign In / Register
            </a>
          </div>
        )}

        {/* ── Step 1: Destination ── */}
        {step === 'destination' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">📍 Where would you like to go?</h3>
            <p className="text-xs text-gray-500 mb-3">Any Indian destination — state, city, or region</p>
            <input value={form.destination} onChange={e => set('destination', e.target.value)}
              placeholder="e.g. Meghalaya, Arunachal Pradesh, Spiti Valley"
              className={`${inputCls} mb-3`} autoFocus />
            <button onClick={() => nextStep('destination')} disabled={!form.destination.trim()}
              className={btnPrimary}>
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Duration ── */}
        {step === 'duration' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">🗓️ How many days?</h3>
            <p className="text-xs text-gray-500 mb-3">Between 1–30 days</p>
            <input type="number" value={form.duration || ''} min={1} max={30}
              onChange={e => set('duration', parseInt(e.target.value) || null)}
              placeholder="e.g. 7" className={`${inputCls} mb-3`} autoFocus />
            <div className="flex gap-2">
              {!trigger?.destination && (
                <button onClick={() => prevStep('duration')} className={btnBack}>← Back</button>
              )}
              <button onClick={() => nextStep('duration')} disabled={!form.duration || form.duration < 1}
                className={`${btnPrimary} flex-1`}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Budget ── */}
        {step === 'budget' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">💰 Budget per person?</h3>
            <p className="text-xs text-gray-500 mb-3">Approximate range to personalize your packages</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {BUDGET_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { set('budget', opt.value); setTimeout(() => nextStep('budget'), 200); }}
                  className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition text-left
                    ${form.budget === opt.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-teal-300 text-gray-700'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => prevStep('budget')} className={btnBack}>← Back</button>
          </div>
        )}

        {/* ── Step 4: Travelers ── */}
        {step === 'travelers' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">👥 How many travelers?</h3>
            <div className="space-y-3 mb-4">
              {[
                { label: 'Adults', sublabel: '12+ years', key: 'adults', min: 1 },
                { label: 'Children', sublabel: '2–12 years', key: 'children', min: 0 },
              ].map(({ label, sublabel, key, min }) => (
                <div key={key} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{sublabel}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => set(key, Math.max(min, form[key] - 1))}
                      className="w-8 h-8 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-teal-400 hover:text-teal-600 font-bold transition text-sm">
                      −
                    </button>
                    <span className="text-lg font-bold text-gray-900 w-6 text-center">{form[key]}</span>
                    <button onClick={() => set(key, form[key] + 1)}
                      className="w-8 h-8 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-teal-400 hover:text-teal-600 font-bold transition text-sm">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => prevStep('travelers')} className={btnBack}>← Back</button>
              <button onClick={() => nextStep('travelers')} className={`${btnPrimary} flex-1`}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 5: Interests ── */}
        {step === 'interests' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">✨ What interests you?</h3>
            <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {INTEREST_OPTIONS.map(({ icon, label }) => (
                <button key={label} onClick={() => toggleInterest(label)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition
                    ${form.interests.includes(label)
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-teal-300 text-gray-700'}`}>
                  <span className="text-xl">{icon}</span>
                  <span className="text-left leading-tight">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => prevStep('interests')} className={btnBack}>← Back</button>
              <button onClick={() => nextStep('interests')} disabled={form.interests.length === 0}
                className={`${btnPrimary} flex-1`}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 6: Activities ── */}
        {step === 'activities' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">🎯 Any specific activities?</h3>
            <p className="text-xs text-gray-500 mb-3">Optional — skip if you want us to suggest</p>
            <textarea value={form.activities} onChange={e => set('activities', e.target.value)} rows={3}
              placeholder="e.g. Scuba diving, trekking, yoga retreat, monastery visits, river rafting..."
              className={`${inputCls} resize-none mb-3`} />
            <div className="flex gap-2">
              <button onClick={() => prevStep('activities')} className={btnBack}>← Back</button>
              <button onClick={() => nextStep('activities')} className={`${btnPrimary} flex-1`}>
                {form.activities.trim() ? 'Continue →' : 'Skip →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 7: Accommodation ── */}
        {step === 'accommodation' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">🏨 Accommodation preference?</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {ACCOMMODATION_OPTIONS.map(opt => (
                <button key={opt.label}
                  onClick={() => { set('accommodation', opt.label); setTimeout(() => nextStep('accommodation'), 200); }}
                  className={`flex flex-col items-center gap-1 px-3 py-4 rounded-xl border-2 transition
                    ${form.accommodation === opt.label
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'}`}>
                  <span className="text-3xl">{opt.icon}</span>
                  <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                  <span className="text-xs text-gray-500">{opt.desc}</span>
                </button>
              ))}
            </div>
            <button onClick={() => prevStep('accommodation')} className={btnBack}>← Back</button>
          </div>
        )}

        {/* ── Step 8: Contact ── */}
        {step === 'contact' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">📱 How can we reach you?</h3>
            <div className="space-y-2.5 mb-3">
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Full name *" className={inputCls} />
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="Email address *" className={inputCls} />
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                type="tel" placeholder="Phone number (optional)" className={inputCls} />
            </div>
            {error && <p className="text-xs text-red-500 mb-3">⚠ {error}</p>}
            <div className="flex gap-2">
              <button onClick={() => prevStep('contact')} className={btnBack}>← Back</button>
              <button onClick={submit}
                disabled={!form.name.trim() || !form.email.trim() || submitting}
                className={`${btnPrimary} flex-1`}>
                {submitting ? 'Submitting…' : '✨ Submit Request'}
              </button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {submitted && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your custom{form.destination ? ` ${form.destination}` : ''} trip request has been received.
              Our travel experts will design a personalized itinerary and contact you within 24 hours.
            </p>
            <div className="bg-teal-50 rounded-xl p-3 text-left mb-3">
              <p className="text-xs font-semibold text-teal-700 mb-1">What happens next?</p>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>Our team reviews your requirements (2–4 hours)</li>
                <li>We design a custom itinerary with pricing</li>
                <li>You receive it via email to review</li>
                <li>Approve, adjust, then book!</li>
              </ol>
            </div>
            <p className="text-xs text-gray-400">Track it in <strong>My Account → Custom Requests</strong></p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Package Cards ─────────────────────────────────────────────────────────────
function PackageCards({ packages, navigate, onBook }) {
  if (!packages?.length) return null;
  return (
    <div className="mt-4 pt-4 border-t border-emerald-100">
      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">
        🎒 Matching TravelSphere Packages
      </p>
      <div className="grid gap-3">
        {packages.map((pkg) => (
          <div key={pkg.id}
            className="flex gap-3 p-3 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-xl transition-all group">
            {pkg.bannerImage && (
              <img src={`${BACKEND_URL}${pkg.bannerImage}`} alt={pkg.title}
                className="w-20 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                onClick={() => navigate(`/packages/${pkg.id}`)} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-700 cursor-pointer"
                onClick={() => navigate(`/packages/${pkg.id}`)}>
                {pkg.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{pkg.durationDays} days · {pkg.destination}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-emerald-700">
                  ₹{Number(pkg.price || 0).toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-gray-400">/person</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/packages/${pkg.id}`)}
                    className="px-2.5 py-1 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition">
                    Details
                  </button>
                  <button onClick={() => onBook(pkg)}
                    className="px-2.5 py-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition font-medium">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/packages')}
        className="mt-3 w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium text-center hover:bg-emerald-50 rounded-lg transition-colors">
        Browse all packages →
      </button>
    </div>
  );
}

// ─── Quick Reply Chips ─────────────────────────────────────────────────────────
function QuickReplies({ replies, onSend, onDirectAction }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3 px-1">
      {replies.map((r) => {
        const isPkg = r.startsWith('📦');
        const isReq = r.startsWith('✨');
        const isDirect = isPkg || isReq;
        return (
          <button key={r}
            onClick={() => isDirect ? onDirectAction?.(r) : onSend(r)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border
              ${isPkg
                ? 'text-white bg-emerald-600 hover:bg-emerald-700 border-emerald-600'
                : isReq
                  ? 'text-white bg-teal-600 hover:bg-teal-700 border-teal-600'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300'}`}>
            {r}
          </button>
        );
      })}
    </div>
  );
}

// ─── Widget message row ────────────────────────────────────────────────────────
function WidgetRow({ message, user, onClose, onSuccess }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600
        flex items-center justify-center text-white">
        <Compass className="w-4 h-4" />
      </div>
      <div className="flex-1">
        {message.widget === 'booking_flow' && (
          <BookingWidget pkg={message.pkg} user={user} onClose={onClose} onSuccess={onSuccess} />
        )}
        {message.widget === 'custom_request' && (
          <CustomRequestForm
            trigger={message.trigger || { trigger: 'user_requested', destination: null }}
            user={user}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, index, user, onFeedback, onRegenerate, onQuickReply, onDirectAction, onBookPackage, onCustomRequestComplete }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  function copy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
        ${isUser ? 'bg-emerald-500' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
        {isUser ? <User className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1 ${isUser ? 'items-end max-w-[70%]' : 'items-start w-full'}`}>
        {!isUser && (
          <span className="text-xs font-semibold text-teal-600 px-1">Wanderly</span>
        )}
        <div className={`rounded-2xl px-4 py-3 leading-relaxed
          ${isUser
            ? 'bg-emerald-500 text-white rounded-tr-sm text-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm w-full'
          }`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="wanderly-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{message.content}</ReactMarkdown>
            </div>
          )}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-teal-500 ml-1 animate-pulse rounded-sm" />
          )}
        </div>

        {/* Package cards + custom request form + quick replies — only on completed assistant messages */}
        {!isUser && !message.isStreaming && message.content && (
          <>
            {message.packages?.length > 0 && (
              <div id={`pkgs-${index}`} className="w-full">
                <PackageCards packages={message.packages} navigate={navigate} onBook={onBookPackage} />
              </div>
            )}
            {message.customRequestTrigger && !message.customRequestCompleted && (
              <div className="w-full mt-3">
                <CustomRequestForm
                  trigger={message.customRequestTrigger}
                  user={user}
                  onSuccess={() => onCustomRequestComplete?.(index)}
                />
              </div>
            )}
            {message.customRequestCompleted && (
              <div className="w-full mt-3 p-3 bg-teal-50 border border-teal-200 rounded-xl text-center">
                <p className="text-sm text-teal-700 font-medium">✅ Custom trip request submitted! We'll reach out within 24 hours.</p>
                <a href="/dashboard/custom-requests" className="text-xs text-teal-600 underline mt-1 inline-block">View My Requests →</a>
              </div>
            )}
            {message.quickReplies?.length > 0 && (
              <QuickReplies
                replies={message.quickReplies}
                onSend={onQuickReply}
                onDirectAction={(reply) => {
                  if (reply.startsWith('📦')) {
                    if (message.packages?.length > 0) {
                      document.getElementById(`pkgs-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate('/packages');
                    }
                  } else {
                    onDirectAction?.(reply);
                  }
                }}
              />
            )}
          </>
        )}

        {/* Actions — only on completed assistant messages */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 px-1">
            <button onClick={copy}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Copy">
              {copied ? <span className="text-xs text-emerald-600 font-medium">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onFeedback(index, 'up')}
              className={`p-1.5 rounded-lg transition-colors ${message.feedback === 'up' ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Helpful">
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onFeedback(index, 'down')}
              className={`p-1.5 rounded-lg transition-colors ${message.feedback === 'down' ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Not helpful">
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            {onRegenerate && (
              <button onClick={onRegenerate}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Regenerate">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ conversations, currentSessionId, onSelect, onNewChat, isOpen, onClose }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 text-white flex flex-col transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Wanderly</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 py-3">
        <button onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600
            hover:from-teal-500 hover:to-emerald-500 text-sm font-medium transition-all">
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {conversations.length > 0 ? (
          <>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">Recent</p>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button key={conv.sessionId}
                  onClick={() => { onSelect(conv.sessionId); onClose(); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors group
                    ${conv.sessionId === currentSessionId
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-tight">
                        {conv.title || 'Untitled conversation'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {conv.messageCount} messages
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-600 px-1 mt-2">No conversations yet. Start planning!</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600">Wanderly AI · TravelSphere</p>
      </div>
    </aside>
  );
}

// ─── Welcome screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ onSuggestion, onCustomRequest }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-5 shadow-lg">
        <Compass className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Hi, I'm Wanderly!</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Your AI travel companion. Tell me where you want to go and I'll craft a perfect itinerary — or book a curated package.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mb-4">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => onSuggestion(s)}
            className="flex items-center gap-2 px-4 py-3 text-left text-sm bg-white border border-gray-200 rounded-xl
              hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group shadow-sm">
            <MapPin className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 flex-shrink-0" />
            <span className="truncate">{s}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-emerald-400 flex-shrink-0" />
          </button>
        ))}
      </div>

      <button onClick={onCustomRequest}
        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
        ✨ Request a Custom Package
      </button>
    </div>
  );
}

// ─── Main TripPlanner ─────────────────────────────────────────────────────────
export default function TripPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => genSessionId());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);

  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const programmaticScrollRef = useRef(false);

  function scrollToBottom(force = false) {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (force || !userScrolledUpRef.current) {
      programmaticScrollRef.current = true;
      el.scrollTop = el.scrollHeight;
      requestAnimationFrame(() => { programmaticScrollRef.current = false; });
    }
  }

  function handleScroll() {
    if (programmaticScrollRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distFromBottom > 40;
  }

  useEffect(() => {
    if (!user) return;
    aiAPI.getMyConversations()
      .then((r) => setConversations(r.data?.data?.conversations || []))
      .catch(() => {});
  }, [user, sessionId]);

  async function loadConversation(sid) {
    try {
      const r = await aiAPI.getConversation(sid);
      const conv = r.data?.data?.conversation;
      if (!conv?.messages) return;

      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      setMessages(msgs);
      setSessionId(sid);
      setTimeout(() => scrollToBottom(true), 50);

      // Re-fetch packages and restore custom request triggers from stored metadata
      msgs.forEach((msg, index) => {
        if (msg.role !== 'assistant') return;

        // Restore custom request trigger (don't re-show completed ones)
        if (msg.customRequestTrigger && !msg.customRequestCompleted) {
          setMessages((prev) => prev.map((m, i) =>
            i === index ? { ...m, customRequestTrigger: msg.customRequestTrigger } : m
          ));
        }

        let dest = null;
        if (msg.packageQuery?.destination) {
          dest = msg.packageQuery.destination;
        } else if (msg.isItinerary) {
          dest = extractDestinationFromText(msg.content);
        }

        if (!dest) return;

        packagesAPI.list({ destination: dest, limit: msg.packageQuery ? 6 : 3 })
          .then((res) => {
            const pkgs = res.data?.data?.items || [];
            if (pkgs.length > 0) {
              setMessages((prev) =>
                prev.map((m, i) => i === index ? { ...m, packages: pkgs.slice(0, msg.packageQuery ? 6 : 3) } : m)
              );
            } else if (msg.packageQuery && !msg.customRequestTrigger && !msg.customRequestCompleted) {
              setMessages((prev) =>
                prev.map((m, i) => i === index
                  ? { ...m, customRequestTrigger: { trigger: 'no_packages', destination: dest } }
                  : m
                )
              );
            }
          })
          .catch(() => {});
      });
    } catch {}
  }

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setTimeout(() => sendMessage(q), 200);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToBottom(true);
  }, [sessionId]);

  // ── Widget management ──────────────────────────────────────────────────────
  function injectWidget(widget, extraData = {}) {
    setMessages((prev) => [...prev, { role: 'ui', widget, ...extraData }]);
    requestAnimationFrame(() => scrollToBottom(true));
  }

  function removeWidget(index) {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  }

  function replaceWidgetWithSuccess(index, type) {
    const content = type === 'booking'
      ? '🎉 **Booking Request Submitted!**\n\nYour booking has been created. Our team will review and confirm it shortly.\n\n[View My Bookings](/dashboard/bookings)'
      : '✅ **Custom Trip Request Submitted!**\n\nWe\'ve received your request and will send a personalized quote within 24 hours.\n\n[View My Requests](/dashboard/custom-requests)';
    setMessages((prev) => prev.map((m, i) =>
      i === index
        ? { role: 'assistant', content, quickReplies: ['Plan another trip', 'Browse packages'] }
        : m
    ));
    setTimeout(() => scrollToBottom(true), 100);
  }

  function handleDirectAction(reply) {
    if (reply.startsWith('✨')) {
      injectWidget('custom_request', { trigger: { trigger: 'user_requested', destination: null } });
    }
  }

  function handleCustomRequestComplete(index) {
    setMessages((prev) => prev.map((m, i) =>
      i === index ? { ...m, customRequestCompleted: true, customRequestTrigger: null } : m
    ));
    setTimeout(() => scrollToBottom(true), 100);
  }

  function handleBookPackage(pkg) {
    injectWidget('booking_flow', { pkg });
  }

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');

    const userMessage = { role: 'user', content: msg };
    const assistantPlaceholder = { role: 'assistant', content: '', isStreaming: true };

    userScrolledUpRef.current = false;
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    requestAnimationFrame(() => scrollToBottom(true));
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = sessionStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Filter out UI widget messages from history
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${BACKEND_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: msg, sessionId, type: 'trip-planner', history }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      let rafId = null;
      const flushToDOM = () => {
        // Strip [SHOW_PACKAGES:...] tags so they never flash as raw text during streaming
        const display = stripTagsForDisplay(accumulated);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: display, isStreaming: true };
          return updated;
        });
        scrollToBottom();
        rafId = null;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'delta') {
              accumulated += parsed.content;
              if (!rafId) rafId = requestAnimationFrame(flushToDOM);
            } else if (parsed.type === 'done') {
              if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

              // Parse all AI response blocks
              const { cleanContent, packageQuery, customRequestTrigger } = parseAIResponse(accumulated);
              const isItinerary = isItineraryResponse(cleanContent);
              const hasPackageQuery = !!packageQuery;
              const hasCustomRequest = !!customRequestTrigger;
              const quickReplies = (isItinerary || hasPackageQuery || hasCustomRequest)
                ? ITINERARY_QUICK_REPLIES : DEFAULT_QUICK_REPLIES;

              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: cleanContent,
                  isStreaming: false,
                  quickReplies,
                  ...(customRequestTrigger ? { customRequestTrigger } : {}),
                };
                return updated;
              });

              // Fetch packages when AI triggered packages:display OR itinerary detected
              if (!hasCustomRequest) {
                const dest = packageQuery?.destination || (isItinerary ? extractDestination(msg) : null);
                if (dest) {
                  const listParams = { destination: dest, limit: hasPackageQuery ? 6 : 3 };
                  if (packageQuery?.duration) listParams.duration = packageQuery.duration;
                  if (packageQuery?.maxBudget) listParams.maxBudget = packageQuery.maxBudget;
                  if (packageQuery?.minBudget) listParams.minBudget = packageQuery.minBudget;
                  packagesAPI.list(listParams)
                    .then((r) => {
                      const pkgs = r.data?.data?.items || [];
                      if (pkgs.length > 0) {
                        setMessages((prev) => {
                          const updated = [...prev];
                          updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            packages: pkgs.slice(0, hasPackageQuery ? 6 : 3),
                          };
                          return updated;
                        });
                      } else if (hasPackageQuery) {
                        // No packages found for this query — surface custom request form
                        setMessages((prev) => {
                          const updated = [...prev];
                          const lastMsg = updated[updated.length - 1];
                          // Drop "📦 View matching packages" chip since there are no packages
                          const filteredReplies = (lastMsg.quickReplies || []).filter(r => !r.startsWith('📦'));
                          updated[updated.length - 1] = {
                            ...lastMsg,
                            customRequestTrigger: { trigger: 'no_packages', destination: dest },
                            quickReplies: filteredReplies,
                          };
                          return updated;
                        });
                      }
                    })
                    .catch(() => {});
                }
              }
            } else if (parsed.type === 'error') {
              if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: parsed.message, isStreaming: false, isError: true };
                return updated;
              });
            }
          } catch {}
        }
      }
      if (rafId) { cancelAnimationFrame(rafId); flushToDOM(); }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: "Sorry, I ran into an issue. Please try again!",
            isStreaming: false,
            isError: true,
          };
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
      if (user) {
        aiAPI.getMyConversations()
          .then((r) => setConversations(r.data?.data?.conversations || []))
          .catch(() => {});
      }
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[updated.length - 1]?.isStreaming) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false };
      }
      return updated;
    });
  }

  function newChat() {
    setMessages([]);
    setSessionId(genSessionId());
    inputRef.current?.focus();
  }

  async function handleFeedback(index, feedback) {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, feedback } : m)));
    try { await aiAPI.submitFeedback(sessionId, index, feedback); } catch {}
  }

  function handleRegenerate(index) {
    const userMsg = messages.slice(0, index).reverse().find((m) => m.role === 'user');
    if (!userMsg) return;
    setMessages((prev) => prev.slice(0, index));
    sendMessage(userMsg.content);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const hasVisibleMessages = messages.some((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'ui');

  return (
    <div className="flex bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        conversations={conversations}
        currentSessionId={sessionId}
        onSelect={loadConversation}
        onNewChat={newChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Wanderly</h1>
              <p className="text-xs text-teal-600 font-medium leading-tight">AI Travel Planner</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-gray-400 ml-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {hasVisibleMessages && (
              <button onClick={newChat}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New chat</span>
              </button>
            )}
            <button onClick={() => injectWidget('custom_request')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
              ✨ Custom Trip
            </button>
            {!user && (
              <a href="/login"
                className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                Sign in to save
              </a>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-h-0"
        >
          {!hasVisibleMessages ? (
            <WelcomeScreen
              onSuggestion={(s) => sendMessage(s)}
              onCustomRequest={() => injectWidget('custom_request')}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, i) => {
                if (msg.role === 'ui') {
                  return (
                    <WidgetRow
                      key={i}
                      message={msg}
                      user={user}
                      onClose={() => removeWidget(i)}
                      onSuccess={(type) => replaceWidgetWithSuccess(i, type)}
                    />
                  );
                }
                return (
                  <MessageBubble
                    key={i}
                    message={msg}
                    index={i}
                    user={user}
                    onFeedback={handleFeedback}
                    onRegenerate={msg.role === 'assistant' ? () => handleRegenerate(i) : null}
                    onQuickReply={sendMessage}
                    onDirectAction={handleDirectAction}
                    onBookPackage={handleBookPackage}
                    onCustomRequestComplete={handleCustomRequestComplete}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3
              focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Wanderly to plan your trip, suggest destinations..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none
                  max-h-32 leading-relaxed"
                style={{ minHeight: '24px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                {isLoading ? (
                  <button onClick={stopStreaming}
                    className="w-9 h-9 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                    title="Stop">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim()}
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center
                      hover:from-teal-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

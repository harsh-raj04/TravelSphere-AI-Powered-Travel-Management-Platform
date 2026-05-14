import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI, packagesAPI, paymentAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  MapPin, Clock, Users, CheckCircle, X, ArrowRight, Calendar,
  AlertCircle, ChevronLeft, Heart, Check, Star,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pkg, setPkg] = useState(null);
  const [details, setDetails] = useState(null);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [bookingForm, setBookingForm] = useState({
    travelers: 1,
    selectedDeparture: null,
    selectedRoom: null,
  });
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [wishlist, setWishlist] = useState(false);

  useEffect(() => {
    loadPackage();
  }, [id]);

  useEffect(() => {
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const loadPackage = async () => {
    setLoading(true);
    try {
      const pkgRes = await packagesAPI.getById(id);
      const pkgData = pkgRes.data.data;
      setPkg(pkgData);

      const [detailsRes, termsRes] = await Promise.allSettled([
        packagesAPI.getDetails(pkgData.id),
        packagesAPI.getTerms(),
      ]);
      if (detailsRes.status === 'fulfilled') setDetails(detailsRes.value.data.data);
      if (termsRes.status === 'fulfilled') setTerms(termsRes.value.data.data || []);
    } catch (err) {
      console.error('Failed to load package', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            Package not found
          </p>
          <Button onClick={() => navigate('/packages')}>Back to Packages</Button>
        </div>
      </div>
    );
  }

  const selectedRoomPrice = bookingForm.selectedRoom ? Number(bookingForm.selectedRoom.price) : Number(pkg?.price || 0);
  const addOnsTotal = selectedAddOns.reduce((sum, ao) => sum + Number(ao.price), 0) * bookingForm.travelers;
  const totalPrice = selectedRoomPrice * bookingForm.travelers + addOnsTotal;
  const bannerImage = pkg?.bannerImage
    ? (pkg.bannerImage.startsWith('http') ? pkg.bannerImage : `http://localhost:4000${pkg.bannerImage}`)
    : null;
  const images = Array.isArray(pkg?.imageUrls) && pkg.imageUrls.length > 0 ? pkg.imageUrls : [];
  const itinerary = details?.itineraries || [];
  const pricingOptions = details?.pricingOptions || [];
  const departures = details?.departures || [];
  const inclusions = (details?.inclusions || []).filter(i => i.type === 'inclusion');
  const exclusions = (details?.inclusions || []).filter(i => i.type === 'exclusion');
  const addOns = details?.addOns || [];

  const submitBooking = async (event) => {
    event.preventDefault();
    setBookingError('');

    if (!bookingForm.selectedDeparture) {
      setBookingError('Please select a departure date.');
      return;
    }

    if (!bookingForm.selectedRoom) {
      setBookingError('Please select a room type.');
      return;
    }

    if (!user) {
      setBookingError('Please log in to book this package.');
      return;
    }

    setBookingLoading(true);
    try {
      const orderRes = await paymentAPI.createOrder({
        package_id: pkg.id,
        departure_id: bookingForm.selectedDeparture.id,
        room_type: bookingForm.selectedRoom.roomType,
        room_price: Number(bookingForm.selectedRoom.price),
        travelers: bookingForm.travelers,
        departure_date: bookingForm.selectedDeparture.departureDate,
        travel_date: bookingForm.selectedDeparture.departureDate,
        add_on_ids: selectedAddOns.map(ao => ao.id),
      });

      const { key_id, order_id, amount, currency, booking_details } = orderRes.data.data;

      const options = {
        key: key_id,
        amount: Number(amount),
        currency: currency || 'INR',
        name: 'TravelSphere',
        description: `${pkg.title} - ${bookingForm.travelers} traveler(s)`,
        order_id: order_id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#0F766E' },
        handler: async function (response) {
          try {
            const verifyRes = await paymentAPI.verify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              booking_details: booking_details,
            });
            const booking = verifyRes.data?.data;
            setBookingResult({
              id: booking?.id,
              travelDate: bookingForm.selectedDeparture?.departureDate,
              travelers: bookingForm.travelers,
              message: `${user?.name?.split(' ')[0] || 'Traveler'}, your journey to ${pkg?.destination || pkg?.title} is confirmed! Pack your bags and get ready for an unforgettable adventure.`,
            });
          } catch {
            setBookingError('Payment successful but booking confirmation failed. Please contact support.');
          }
          setBookingLoading(false);
        },
        modal: {
          ondismiss: function () {
            setBookingResult(prev => {
              if (!prev) {
                setBookingError('Payment was not completed.');
              }
              return prev;
            });
            setBookingLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', function () {
        setBookingError('Payment failed. Please try again.');
        setBookingLoading(false);
      });
    } catch (err) {
      setBookingError(err?.response?.data?.message || 'Payment initiation failed. Please try again.');
      setBookingLoading(false);
    }
  };

  // Default inclusions if none from API
  const defaultInclusions = ['Accommodation', 'Meals (Breakfast & Dinner)', 'Guided Tours', 'Transport', 'Travel Insurance'];

  return (
    <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        {bannerImage ? (
          <img src={bannerImage} alt={pkg.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#022C22] via-[#0F766E] to-[#14B8A6]" />
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => navigate('/packages')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-sm text-teal-700 font-medium text-sm hover:bg-white transition-all shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to packages
          </button>
        </div>

        {/* Wishlist button */}
        <button
          onClick={() => setWishlist(!wishlist)}
          className="absolute top-6 right-6 z-10 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition"
        >
          <Heart className={`w-5 h-5 ${wishlist ? 'fill-red-400 text-red-400' : 'text-white'}`} />
        </button>

        {/* Hero bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="success" size="sm">{pkg.category?.replace(/_/g, ' ')}</Badge>
              <Badge variant="accent" size="sm">{pkg.durationDays} Days</Badge>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-3 leading-tight">
              {pkg.title}
            </h1>
            <div className="flex items-center gap-4 text-teal-100 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {pkg.destination}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {pkg.rating ? `${pkg.rating.toFixed(1)} rating` : 'Not yet rated'}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                2-20 travelers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About this trip */}
            <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-7 border border-teal-100/60 dark:border-dark-border shadow-sm">
              <h2 className="text-2xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-4">
                About this trip
              </h2>
              <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                {pkg.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-light-border dark:border-dark-border">
                <div className="bg-teal-50/50 dark:bg-dark-bg-tertiary rounded-xl p-4 text-center">
                  <Clock className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-0.5">Duration</p>
                  <p className="font-bold text-light-text-primary dark:text-dark-text-primary text-sm">{pkg.durationDays} Days</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-dark-bg-tertiary rounded-xl p-4 text-center">
                  <MapPin className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-0.5">Destination</p>
                  <p className="font-bold text-light-text-primary dark:text-dark-text-primary text-sm">{pkg.destination}</p>
                </div>
                <div className="bg-teal-50/50 dark:bg-dark-bg-tertiary rounded-xl p-4 text-center">
                  <Users className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-0.5">Group Size</p>
                  <p className="font-bold text-light-text-primary dark:text-dark-text-primary text-sm">2-20 pax</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-light-border dark:border-dark-border overflow-x-auto">
              <div className="flex gap-6 min-w-max">
                {['itinerary', 'pricing', 'inclusions', 'departures', 'terms'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 font-semibold capitalize transition whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                    }`}
                  >
                    {tab === 'inclusions' ? 'Inclusions' : tab === 'terms' ? 'Terms & Conditions' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Day-by-day itinerary */}
            {activeTab === 'itinerary' && (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-7 border border-teal-100/60 dark:border-dark-border shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-6">
                  Day-by-day itinerary
                </h2>
                {itinerary.length > 0 ? (
                  <div className="space-y-6">
                    {itinerary.map((day, idx) => (
                      <div key={day.dayNumber} className="flex gap-5">
                        {/* Timeline circle + line */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-200 flex flex-col items-center justify-center text-center flex-shrink-0">
                            <span className="text-[10px] font-semibold opacity-80 leading-none">Day</span>
                            <span className="text-xl font-bold leading-none">{day.dayNumber}</span>
                          </div>
                          {idx < itinerary.length - 1 && (
                            <div className="w-1 flex-1 min-h-[32px] mt-2 bg-gradient-to-b from-teal-500 to-transparent rounded-full" />
                          )}
                        </div>
                        {/* Day card */}
                        <div className="flex-1 bg-teal-50/50 rounded-xl p-5 border border-teal-100 dark:bg-dark-bg-tertiary dark:border-dark-border">
                          <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary text-base mb-2">
                            {day.title}
                          </h3>
                          <div className="space-y-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            {day.morningActivity && (
                              <p><span className="font-medium text-amber-600 dark:text-amber-400">Morning:</span> {day.morningActivity}</p>
                            )}
                            {day.afternoonActivity && (
                              <p><span className="font-medium text-orange-500 dark:text-orange-400">Afternoon:</span> {day.afternoonActivity}</p>
                            )}
                            {day.eveningActivity && (
                              <p><span className="font-medium text-indigo-600 dark:text-indigo-400">Evening:</span> {day.eveningActivity}</p>
                            )}
                            {day.nightActivity && (
                              <p><span className="font-medium text-slate-500 dark:text-slate-400">Night:</span> {day.nightActivity}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-light-text-secondary dark:text-dark-text-secondary py-8 text-center">
                    Itinerary details coming soon.
                  </p>
                )}
              </div>
            )}

            {/* Pricing */}
            {activeTab === 'pricing' && (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-7 border border-teal-100/60 dark:border-dark-border shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-6">
                  Pricing & Room Options
                </h2>
                {pricingOptions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-light-border dark:border-dark-border">
                          <th className="text-left py-3 px-4 font-semibold text-light-text-primary dark:text-dark-text-primary">Room Type</th>
                          <th className="text-right py-3 px-4 font-semibold text-light-text-primary dark:text-dark-text-primary">Price / Person</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingOptions.map((opt, idx) => (
                          <tr key={idx} className="border-b border-light-border dark:border-dark-border hover:bg-teal-50/40 dark:hover:bg-dark-bg-tertiary transition-colors">
                            <td className="py-3 px-4 text-light-text-primary dark:text-dark-text-primary capitalize font-medium">
                              {opt.roomType?.replace(/_/g, ' ')}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-teal-600 dark:text-teal-400">
                              ₹{Number(opt.price).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-3">
                      Prices may vary based on departure date.
                    </p>
                  </div>
                ) : (
                  <p className="text-light-text-secondary dark:text-dark-text-secondary py-8 text-center">
                    Pricing details coming soon.
                  </p>
                )}
              </div>
            )}

            {/* Inclusions */}
            {activeTab === 'inclusions' && (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-7 border border-teal-100/60 dark:border-dark-border shadow-sm space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-4">
                    Inclusions
                  </h2>
                  <div className="space-y-2">
                    {(inclusions.length > 0 ? inclusions.map(i => i.description) : defaultInclusions).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                        <p className="text-light-text-primary dark:text-dark-text-primary text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {exclusions.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-4">
                      Exclusions
                    </h2>
                    <div className="space-y-2">
                      {exclusions.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                          <X className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                          <p className="text-light-text-primary dark:text-dark-text-primary text-sm">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Terms & Conditions */}
            {activeTab === 'terms' && (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-7 border border-teal-100/60 dark:border-dark-border shadow-sm space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-1">
                    Terms & Conditions
                  </h2>
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    Please read these terms carefully before booking. By completing your booking you agree to all the terms below.
                  </p>
                </div>
                {terms.length === 0 ? (
                  <p className="text-light-text-secondary dark:text-dark-text-secondary py-8 text-center">
                    Terms & conditions coming soon.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {terms.map((section) => (
                      <div key={section.id} className="border border-teal-100/60 dark:border-dark-border rounded-xl overflow-hidden">
                        <div className="bg-teal-50/60 dark:bg-dark-bg-tertiary px-5 py-3 border-b border-teal-100/60 dark:border-dark-border">
                          <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary text-sm tracking-tight">
                            {section.order}. {section.title}
                          </h3>
                        </div>
                        <div className="px-5 py-4">
                          {section.content.split('\n').map((line, i) => {
                            const trimmed = line.trim();
                            if (!trimmed) return null;
                            return (
                              <p key={i} className={`text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed ${
                                trimmed.startsWith('•') ? 'pl-2 mb-1.5' : 'mb-2 font-medium text-light-text-primary dark:text-dark-text-primary'
                              }`}>
                                {trimmed}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary border-t border-light-border dark:border-dark-border pt-4">
                  Last updated: May 2026 · TravelSphere, Law Gate, Phagwara, Punjab 144411, India
                </p>
              </div>
            )}

            {/* Departures */}
            {activeTab === 'departures' && (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-7 border border-teal-100/60 dark:border-dark-border shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-6">
                  Available Departures
                </h2>
                {departures.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-light-border dark:border-dark-border">
                          <th className="text-left py-3 px-4 font-semibold text-light-text-primary dark:text-dark-text-primary">Date</th>
                          <th className="text-center py-3 px-4 font-semibold text-light-text-primary dark:text-dark-text-primary">Available Seats</th>
                          <th className="text-right py-3 px-4 font-semibold text-light-text-primary dark:text-dark-text-primary">Price</th>
                          <th className="text-right py-3 px-4 font-semibold text-light-text-primary dark:text-dark-text-primary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departures.map((dep, idx) => {
                          const available = (dep.availableSeats - (dep.bookedSeats || 0));
                          const soldOut = available <= 0;
                          return (
                            <tr key={idx} className={`border-b border-light-border dark:border-dark-border ${soldOut ? 'opacity-50' : 'hover:bg-teal-50/40 dark:hover:bg-dark-bg-tertiary transition-colors'}`}>
                              <td className="py-3 px-4 font-medium text-light-text-primary dark:text-dark-text-primary">
                                {new Date(dep.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-3 px-4 text-center text-light-text-secondary dark:text-dark-text-secondary">
                                {soldOut ? '—' : available}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-teal-600 dark:text-teal-400">
                                ₹{Number(dep.price).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {soldOut ? (
                                  <Badge variant="danger" size="sm">Sold Out</Badge>
                                ) : available < 5 ? (
                                  <Badge variant="warning" size="sm">Only {available} left</Badge>
                                ) : (
                                  <Badge variant="success" size="sm">Available</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-light-text-secondary dark:text-dark-text-secondary py-8 text-center">
                    Departure dates coming soon.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right sticky sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Pricing card */}
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 border border-teal-100/60 dark:border-dark-border shadow-sm space-y-5">
                {/* Price */}
                <div className="pb-5 border-b border-light-border dark:border-dark-border">
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide mb-1">
                    Starting from
                  </p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                      ₹{pkg.price?.toLocaleString()}
                    </p>
                    <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">/ person</span>
                  </div>
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                    Taxes & inclusions covered
                  </p>
                </div>

                {/* Booking Form */}
                <form className="space-y-4" onSubmit={submitBooking}>
                  {bookingError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                      {bookingError}
                    </div>
                  )}

                  {/* Departure Date */}
                  <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                      Departure Date
                    </label>
                    {departures.length > 0 ? (
                      <div className="space-y-2 max-h-44 overflow-y-auto">
                        {departures.map((dep, idx) => {
                          const available = (dep.availableSeats - (dep.bookedSeats || 0));
                          const soldOut = available <= 0;
                          const isSelected = bookingForm.selectedDeparture?.id === dep.id;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={soldOut}
                              onClick={() => setBookingForm({ ...bookingForm, selectedDeparture: dep })}
                              className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition text-sm ${
                                soldOut
                                  ? 'border-light-border dark:border-dark-border opacity-40 cursor-not-allowed'
                                  : isSelected
                                  ? 'border-teal-600 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                                  : 'border-light-border dark:border-dark-border hover:border-teal-400/50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                                  {new Date(dep.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className={`text-xs font-medium ${soldOut ? 'text-red-500' : available < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {soldOut ? 'Sold Out' : `${available} seats`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <Input type="date" value={bookingForm.travelDate || ''} min={new Date().toISOString().split('T')[0]} onChange={(e) => setBookingForm({ ...bookingForm, travelDate: e.target.value })} />
                    )}
                  </div>

                  {/* Room Type */}
                  <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                      Room Type
                    </label>
                    {pricingOptions.length > 0 ? (
                      <div className="space-y-2">
                        {pricingOptions.map((opt, idx) => {
                          const isSelected = bookingForm.selectedRoom?.roomType === opt.roomType;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setBookingForm({ ...bookingForm, selectedRoom: opt })}
                              className={`w-full flex justify-between items-center px-3 py-2.5 rounded-lg border-2 text-sm transition ${
                                isSelected
                                  ? 'border-teal-600 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                                  : 'border-light-border dark:border-dark-border hover:border-teal-400/50'
                              }`}
                            >
                              <span className="font-medium capitalize text-light-text-primary dark:text-dark-text-primary">
                                {opt.roomType?.replace(/_/g, ' ')}
                              </span>
                              <span className="font-bold text-teal-600 dark:text-teal-400">
                                ₹{Number(opt.price).toLocaleString()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Loading options...</p>
                    )}
                  </div>

                  {/* Travellers */}
                  <div>
                    <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                      Travellers
                    </label>
                    <select
                      value={bookingForm.travelers}
                      onChange={(e) => setBookingForm({ ...bookingForm, travelers: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-teal-500 text-sm"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'traveller' : 'travellers'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Add-ons */}
                  {addOns.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                        Add-ons <span className="font-normal text-light-text-tertiary dark:text-dark-text-tertiary">(optional)</span>
                      </label>
                      <div className="space-y-2">
                        {addOns.map((ao) => {
                          const isSelected = selectedAddOns.some(s => s.id === ao.id);
                          return (
                            <button
                              key={ao.id}
                              type="button"
                              onClick={() =>
                                setSelectedAddOns(prev =>
                                  isSelected ? prev.filter(s => s.id !== ao.id) : [...prev, ao]
                                )
                              }
                              className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition text-sm flex items-start gap-2.5 ${
                                isSelected
                                  ? 'border-teal-600 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                                  : 'border-light-border dark:border-dark-border hover:border-teal-400/50'
                              }`}
                            >
                              <span className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${
                                isSelected ? 'border-teal-600 bg-teal-600' : 'border-gray-300 dark:border-dark-border'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-light-text-primary dark:text-dark-text-primary">{ao.title}</p>
                                {ao.description && (
                                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-0.5">{ao.description}</p>
                                )}
                              </div>
                              <span className="font-bold text-teal-600 dark:text-teal-400 flex-shrink-0">+₹{Number(ao.price).toLocaleString()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="p-4 bg-teal-50/50 dark:bg-dark-bg-tertiary rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">
                        ₹{selectedRoomPrice.toLocaleString()} × {bookingForm.travelers} {bookingForm.travelers === 1 ? 'traveller' : 'travellers'}
                      </span>
                      <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        ₹{(selectedRoomPrice * bookingForm.travelers).toLocaleString()}
                      </span>
                    </div>
                    {selectedAddOns.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">
                          Add-ons × {bookingForm.travelers}
                        </span>
                        <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                          +₹{addOnsTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-light-border dark:border-dark-border pt-2 flex justify-between">
                      <span className="font-bold text-light-text-primary dark:text-dark-text-primary">Total</span>
                      <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                        ₹{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Book button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!bookingForm.selectedDeparture || !bookingForm.selectedRoom || bookingLoading}
                  >
                    {bookingLoading ? 'Booking...' : 'Book this trip'}
                  </Button>

                  <a
                    href="https://wa.me/917992336832"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold shadow-md shadow-[#25D366]/30 transition-all flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Connect on WhatsApp
                  </a>
                </form>
              </div>

              {/* What's included card */}
              <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 border border-teal-100/60 dark:border-dark-border shadow-sm">
                <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                  What's included
                </h3>
                <div className="space-y-2.5">
                  {(inclusions.length > 0 ? inclusions.map(i => i.description) : defaultInclusions).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking success modal */}
      {bookingResult && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingResult(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#22D3EE] px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Booking Confirmed!</h2>
              <p className="text-white/80 text-sm">{bookingResult.message}</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-1">Booking ID</p>
                <p className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wider">{bookingResult.id}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-teal-500" />
                  <span className="text-sm">{pkg?.title}</span>
                </div>
                {bookingResult.travelDate && (
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <span className="text-sm">{new Date(bookingResult.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                {bookingResult.travelers && (
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 text-teal-500" />
                    <span className="text-sm">{bookingResult.travelers} {bookingResult.travelers === 1 ? 'traveler' : 'travelers'}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setBookingResult(null)}
                  className="flex-1 rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={() => navigate('/bookings')}
                  className="flex-1 rounded-xl bg-[#0F766E] hover:bg-[#064E48] flex items-center justify-center gap-2"
                >
                  My Bookings
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <button
              onClick={() => setBookingResult(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

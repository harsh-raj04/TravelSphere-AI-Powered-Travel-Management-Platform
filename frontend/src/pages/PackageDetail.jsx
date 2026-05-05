import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI, packagesAPI, paymentAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MapPin, Clock, Users, CheckCircle, X, ArrowRight, Calendar, AlertCircle, ChevronLeft, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pkg, setPkg] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingForm, setBookingForm] = useState({
    travelers: 1,
    selectedDeparture: null,
    selectedRoom: null,
  });
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
      setPkg(pkgRes.data.data);
    } catch (err) {
      console.error('Failed to load package', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pkg) {
      packagesAPI.getDetails(pkg.id)
        .then(res => setDetails(res.data.data))
        .catch(err => console.error('Failed to load package details', err));
    }
  }, [pkg]);

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
  const totalPrice = selectedRoomPrice * bookingForm.travelers;
  const bannerImage = pkg?.bannerImage
    ? (pkg.bannerImage.startsWith('http') ? pkg.bannerImage : `http://localhost:4000${pkg.bannerImage}`)
    : null;
  const images = Array.isArray(pkg?.imageUrls) && pkg.imageUrls.length > 0 ? pkg.imageUrls : [];
  const itinerary = details?.itineraries || [];
  const pricingOptions = details?.pricingOptions || [];
  const departures = details?.departures || [];
  const inclusions = (details?.inclusions || []).filter(i => i.type === 'inclusion');
  const exclusions = (details?.inclusions || []).filter(i => i.type === 'exclusion');

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
            // Only show error if booking didn't already succeed
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

  return (
    <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
      {/* Hero Banner */}
      <div className="relative h-96 bg-gradient-to-br from-[#022C22] via-[#0F766E] to-[#14B8A6] overflow-hidden">
        {bannerImage ? (
          <>
            <img src={bannerImage} alt={pkg.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/35" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-brand opacity-60" />
        )}
        <div className="absolute inset-0 flex items-start justify-start pt-12">
          <button
            onClick={() => navigate('/packages')}
            className="ml-4 sm:ml-6 lg:ml-8 flex items-center gap-2 text-white hover:text-blue-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => setWishlist(!wishlist)}
          className="absolute top-12 right-4 sm:right-6 lg:right-8 p-3 bg-white/20 backdrop-blur-lg rounded-lg hover:bg-white/30 transition"
        >
          <Heart className={`w-6 h-6 ${wishlist ? 'fill-red-400 text-red-400' : 'text-white'}`} />
        </button>

      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 mb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Card */}
            <Card variant="elevated" className="p-8">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                      {pkg.title}
                    </h1>
                    <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary">
                      <MapPin className="w-5 h-5" />
                      <span className="text-lg">{pkg.destination}</span>
                    </div>
                  </div>
                  <Badge variant="success" size="lg">
                    ⭐ 4.8
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-6 pt-4 border-t border-light-border dark:border-dark-border">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand-primary" />
                    <div>
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Duration</p>
                      <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {pkg.durationDays} Days & Nights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-brand-primary" />
                    <div>
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                        Group Size
                      </p>
                      <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        2-20 Travelers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <div className="border-b border-light-border dark:border-dark-border overflow-x-auto">
              <div className="flex gap-6 min-w-max">
                {['overview', 'itinerary', 'pricing', 'inclusions', 'departures'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 font-semibold capitalize transition ${
                      activeTab === tab
                        ? 'text-brand-primary dark:text-brand-secondary border-b-2 border-brand-primary dark:border-brand-secondary'
                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <Card variant="elevated" className="p-8 space-y-6">
              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">About This Trip</h3>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                    {pkg.description}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-light-border dark:border-dark-border">
                    <div className="bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-lg p-4 text-center">
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">Duration</p>
                      <p className="font-bold text-light-text-primary dark:text-dark-text-primary">{pkg.durationDays} Days</p>
                    </div>
                    <div className="bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-lg p-4 text-center">
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">Destination</p>
                      <p className="font-bold text-light-text-primary dark:text-dark-text-primary">{pkg.destination}</p>
                    </div>
                    <div className="bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-lg p-4 text-center">
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">Base Price</p>
                      <p className="font-bold text-brand-primary">₹{pkg.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Itinerary */}
              {activeTab === 'itinerary' && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Day-wise Itinerary</h3>
                  {itinerary.length > 0 ? (
                    <div className="space-y-0 border-l-2 border-light-border dark:border-dark-border ml-2">
                      {itinerary.map((day) => (
                        <div key={day.dayNumber} className="relative pl-8 pb-8 last:pb-0">
                          <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-primary dark:bg-brand-secondary border-2 border-white dark:border-dark-bg-primary" />
                          <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary text-lg mb-2">
                            Day {day.dayNumber}: {day.title}
                          </h4>
                          <div className="space-y-3">
                            {day.morningActivity && (
                              <div className="flex items-start gap-3 text-sm">
                                <span className="mt-0.5 w-14 text-xs font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">☀️ Morning</span>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary">{day.morningActivity}</p>
                              </div>
                            )}
                            {day.afternoonActivity && (
                              <div className="flex items-start gap-3 text-sm">
                                <span className="mt-0.5 w-14 text-xs font-semibold text-orange-600 dark:text-orange-400 flex-shrink-0">🌤️ Aftrn</span>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary">{day.afternoonActivity}</p>
                              </div>
                            )}
                            {day.eveningActivity && (
                              <div className="flex items-start gap-3 text-sm">
                                <span className="mt-0.5 w-14 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">🌅 Evening</span>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary">{day.eveningActivity}</p>
                              </div>
                            )}
                            {day.nightActivity && (
                              <div className="flex items-start gap-3 text-sm">
                                <span className="mt-0.5 w-14 text-xs font-semibold text-slate-600 dark:text-slate-400 flex-shrink-0">🌙 Night</span>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary">{day.nightActivity}</p>
                              </div>
                            )}
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
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Pricing & Room Options</h3>
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
                            <tr key={idx} className="border-b border-light-border dark:border-dark-border hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors">
                              <td className="py-3 px-4 text-light-text-primary dark:text-dark-text-primary capitalize font-medium">
                                {opt.roomType?.replace(/_/g, ' ')}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-brand-primary dark:text-brand-secondary">
                                ₹{Number(opt.price).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-3">
                        * GST 5% extra. Prices may vary based on departure date.
                      </p>
                    </div>
                  ) : (
                    <p className="text-light-text-secondary dark:text-dark-text-secondary py-8 text-center">
                      Pricing details coming soon.
                    </p>
                  )}
                </div>
              )}

              {/* Inclusions & Exclusions */}
              {activeTab === 'inclusions' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">✅ Inclusions</h3>
                    {inclusions.length > 0 ? (
                      <div className="space-y-2">
                        {inclusions.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            <span className="text-emerald-600 dark:text-emerald-400 text-lg">✓</span>
                            <p className="text-light-text-primary dark:text-dark-text-primary text-sm">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {['Accommodation', 'Meals (Breakfast & Dinner)', 'Guided Tours', 'Transport', 'Travel Insurance'].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            <span className="text-emerald-600 dark:text-emerald-400 text-lg">✓</span>
                            <p className="text-light-text-primary dark:text-dark-text-primary text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">❌ Exclusions</h3>
                    {exclusions.length > 0 ? (
                      <div className="space-y-2">
                        {exclusions.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                            <span className="text-red-500 dark:text-red-400 text-lg">✗</span>
                            <p className="text-light-text-primary dark:text-dark-text-primary text-sm">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {['Flight / Train tickets', 'Personal expenses', 'Tips & gratuities', 'Travel insurance'].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                            <span className="text-red-500 dark:text-red-400 text-lg">✗</span>
                            <p className="text-light-text-primary dark:text-dark-text-primary text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Departures */}
              {activeTab === 'departures' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Available Departures</h3>
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
                              <tr key={idx} className={`border-b border-light-border dark:border-dark-border ${soldOut ? 'opacity-50' : 'hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors'}`}>
                                <td className="py-3 px-4 font-medium text-light-text-primary dark:text-dark-text-primary">
                                  {new Date(dep.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-3 px-4 text-center text-light-text-secondary dark:text-dark-text-secondary">
                                  {soldOut ? '—' : available}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-brand-primary dark:text-brand-secondary">
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
            </Card>
          </div>

          {/* Booking Card (Sticky) */}
          <div className="lg:col-span-1">
            <Card variant="premium" className="p-6 space-y-6 sticky top-20">
              {/* Price */}
              <div className="text-center pb-6 border-b border-light-border dark:border-dark-border">
                <p className="text-light-text-tertiary dark:text-dark-text-tertiary text-sm mb-2">
                  Starting from
                </p>
                <p className="text-4xl font-bold text-brand-primary dark:text-brand-secondary">
                  ₹{pkg.price?.toLocaleString()}
                </p>
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">per person</p>
              </div>

              {/* Booking Form */}
              <form className="space-y-5" onSubmit={submitBooking}>
                {bookingError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                    {bookingError}
                  </div>
                )}

                {/* Departure Date Selector */}
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
                                ? 'border-brand-primary dark:border-brand-secondary bg-teal-50 dark:bg-teal-900/20'
                                : 'border-light-border dark:border-dark-border hover:border-brand-primary/50'
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
                    <Input type="date" value={bookingForm.travelDate || ''} onChange={(e) => setBookingForm({ ...bookingForm, travelDate: e.target.value })} />
                  )}
                </div>

                {/* Room Type Selector */}
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
                                ? 'border-brand-primary dark:border-brand-secondary bg-teal-50 dark:bg-teal-900/20'
                                : 'border-light-border dark:border-dark-border hover:border-brand-primary/50'
                            }`}
                          >
                            <span className="font-medium capitalize text-light-text-primary dark:text-dark-text-primary">
                              {opt.roomType?.replace(/_/g, ' ')}
                            </span>
                            <span className="font-bold text-brand-primary dark:text-brand-secondary">
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

                {/* Travelers */}
                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Travelers
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingForm({ ...bookingForm, travelers: Math.max(1, bookingForm.travelers - 1) })}
                      className="w-10 h-10 rounded-lg border-2 border-light-border dark:border-dark-border flex items-center justify-center text-lg font-bold text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                      {bookingForm.travelers}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBookingForm({ ...bookingForm, travelers: Math.min(20, bookingForm.travelers + 1) })}
                      className="w-10 h-10 rounded-lg border-2 border-light-border dark:border-dark-border flex items-center justify-center text-lg font-bold text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">
                      ₹{selectedRoomPrice.toLocaleString()} × {bookingForm.travelers} {bookingForm.travelers === 1 ? 'traveler' : 'travelers'}
                    </span>
                    <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                      ₹{totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-light-border dark:border-dark-border pt-2 flex justify-between">
                    <span className="font-bold text-light-text-primary dark:text-dark-text-primary">
                      Total
                    </span>
                    <span className="text-xl font-bold text-brand-primary dark:text-brand-secondary">
                      ₹{totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">* GST 5% extra</p>
                </div>

                {/* Book Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={!bookingForm.selectedDeparture || !bookingForm.selectedRoom || bookingLoading}
                >
                  {bookingLoading ? 'Booking...' : 'Book Now'}
                </Button>

                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary text-center">
                  Free cancellation up to 7 days before travel
                </p>
              </form>

              {/* Support Card */}
              <Card variant="glass" className="p-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Need Help?
                  </p>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    Contact our travel experts
                  </p>
                  <a
                    href="tel:+917992336832"
                    className="text-brand-primary dark:text-brand-secondary font-semibold hover:underline mt-2 inline-block"
                  >
                    +91-799-233-6832
                  </a>
                </div>
              </Card>
            </Card>
          </div>
        </div>
      </div>

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

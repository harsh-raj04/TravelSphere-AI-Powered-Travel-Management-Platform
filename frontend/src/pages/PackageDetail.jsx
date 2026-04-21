import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI, packagesAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MapPin, Clock, Users, AlertCircle, ChevronLeft, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingForm, setBookingForm] = useState({
    travelers: 1,
    travelDate: '',
    customerName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [wishlist, setWishlist] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setBookingForm((prev) => ({
      ...prev,
      customerName: user?.name || prev.customerName,
      contactEmail: user?.email || prev.contactEmail,
    }));
  }, [user?.name, user?.email]);

  useEffect(() => {
    loadPackage();
  }, [id]);

  const loadPackage = async () => {
    setLoading(true);
    try {
      const res = await packagesAPI.getById(id);
      setPkg(res.data.data);
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

  const totalPrice = pkg.price * bookingForm.travelers;
  const images = Array.isArray(pkg?.imageUrls) && pkg.imageUrls.length > 0 ? pkg.imageUrls : [];
  const itinerary = Array.isArray(pkg?.itinerary) ? pkg.itinerary : [];

  const submitBooking = async (event) => {
    event.preventDefault();
    setBookingError('');

    if (!bookingForm.travelDate) {
      setBookingError('Please select a travel date.');
      return;
    }

    if (!bookingForm.customerName.trim() || !bookingForm.contactEmail.trim()) {
      setBookingError('Customer name and contact email are required.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await bookingsAPI.create({
        package_id: pkg.id,
        travel_date: bookingForm.travelDate,
        travelers_count: bookingForm.travelers,
        customer_name: bookingForm.customerName,
        contact_email: bookingForm.contactEmail,
        contact_phone: bookingForm.contactPhone || undefined,
        travel_message: `Adventure awaits in ${pkg.title}.`,
      });

      const booking = res.data?.data;
      setBookingResult({
        id: booking?.id,
        message: 'Journey begins where plans meet courage. Your booking request is now in review.',
      });
    } catch (err) {
      setBookingError(err?.response?.data?.message || 'Booking request failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
      {/* Hero Banner */}
      <div className="relative h-96 bg-gradient-to-br from-[#ff6a00] via-[#ff7f27] to-[#ff8f3a] overflow-hidden">
        {images.length > 0 ? (
          <>
            <img src={images[activeImageIndex]} alt={pkg.title} className="absolute inset-0 w-full h-full object-cover" />
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

        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {images.map((_, index) => (
              <button
                key={`img-dot-${index}`}
                onClick={() => setActiveImageIndex(index)}
                className={`w-2.5 h-2.5 rounded-full ${index === activeImageIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
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
            <div className="border-b border-light-border dark:border-dark-border">
              <div className="flex gap-8">
                {['overview', 'itinerary', 'inclusions'].map((tab) => (
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
            <Card variant="elevated" className="p-8">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                    {pkg.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
                        Best Season
                      </p>
                      <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        Oct - Mar
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
                        Difficulty Level
                      </p>
                      <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        Moderate
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div className="space-y-4">
                  {(itinerary.length > 0 ? itinerary : Array.from({ length: Number(pkg.durationDays || 0) }, (_, idx) => `Itinerary for Day ${idx + 1} will be updated soon.`)).map((plan, index) => (
                    <div
                      key={index + 1}
                      className="p-4 bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-lg border border-light-border dark:border-dark-border"
                    >
                      <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                        Day {index + 1}
                      </h4>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {plan}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'inclusions' && (
                <div className="space-y-2">
                  {['Accommodation', 'Meals (Breakfast & Dinner)', 'Guided Tours', 'Transport', 'Travel Insurance'].map(
                    (item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-lg">
                        <span className="text-brand-primary text-xl">✓</span>
                        <p className="text-light-text-primary dark:text-dark-text-primary">{item}</p>
                      </div>
                    )
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
                  Price per person
                </p>
                <p className="text-4xl font-bold text-brand-primary dark:text-brand-secondary">
                  ₹{pkg.price?.toLocaleString()}
                </p>
              </div>

              {/* Booking Form */}
              <form className="space-y-4" onSubmit={submitBooking}>
                {bookingError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                    {bookingError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={bookingForm.contactEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Contact Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.contactPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={bookingForm.travelers}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        travelers: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Travel Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.travelDate}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, travelDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                  />
                </div>

                {/* Price Breakdown */}
                <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">
                      ₹{pkg.price?.toLocaleString()} × {bookingForm.travelers}
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
                </div>

                {/* Book Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={!bookingForm.travelDate || bookingLoading}
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
                    href="tel:+918001234567"
                    className="text-brand-primary dark:text-brand-secondary font-semibold hover:underline mt-2 inline-block"
                  >
                    +91-800-123-4567
                  </a>
                </div>
              </Card>
            </Card>
          </div>
        </div>
      </div>

      {bookingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4">
                ✓
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Congratulations, Traveler!</h3>
              <p className="text-base text-gray-600 dark:text-gray-300">Your booking request has been successfully submitted.</p>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-slate-800 dark:to-slate-700 p-6 mb-6 text-center">
              <p className="text-sm uppercase tracking-wide text-indigo-600 dark:text-indigo-300 mb-2">Travel Quote</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">"{bookingResult.message}"</p>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">Booking ID: <span className="font-semibold text-gray-900 dark:text-white">{bookingResult.id}</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Package: <span className="font-semibold text-gray-900 dark:text-white">{pkg?.title}</span></p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setBookingResult(null)}>Stay Here</Button>
              <Button onClick={() => navigate('/bookings')}>Go to My Bookings</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

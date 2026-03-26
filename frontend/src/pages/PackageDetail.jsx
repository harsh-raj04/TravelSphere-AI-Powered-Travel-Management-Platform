import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packagesAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MapPin, Clock, Users, AlertCircle, ChevronLeft, Heart } from 'lucide-react';

export function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingForm, setBookingForm] = useState({
    travelers: 1,
    travelDate: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [wishlist, setWishlist] = useState(false);

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

  return (
    <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
      {/* Hero Banner */}
      <div className="relative h-96 bg-gradient-to-br from-blue-400 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand opacity-60" />
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
                  {[1, 2, 3].map((day) => (
                    <div
                      key={day}
                      className="p-4 bg-light-bg-secondary dark:bg-dark-bg-tertiary rounded-lg border border-light-border dark:border-dark-border"
                    >
                      <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                        Day {day}
                      </h4>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Detailed itinerary for day {day} will be displayed here
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
              <form className="space-y-4">
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
                  onClick={(e) => {
                    e.preventDefault();
                    if (!bookingForm.travelDate) {
                      alert('Please select a travel date');
                      return;
                    }
                    alert(`Booking ${bookingForm.travelers} travelers for ₹${totalPrice}`);
                  }}
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
    </div>
  );
}

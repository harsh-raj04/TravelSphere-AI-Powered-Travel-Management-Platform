import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Phone, Mail, Search, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { packageService, getImageUrl } from '../services/packageService';

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

function DestinationsCarousel({ destinations }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-teal-50/50 dark:bg-dark-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-2 tracking-tight">
              Top Destinations
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Most loved destinations by our travellers
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll destinations left"
              className="p-3 rounded-full bg-white dark:bg-dark-bg-secondary border border-teal-200 dark:border-dark-border text-teal-600 hover:bg-teal-50 dark:hover:bg-dark-bg shadow-sm transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll destinations right"
              className="p-3 rounded-full bg-teal-600 text-white hover:bg-teal-700 shadow-md transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {destinations.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {destinations.map((dest) => (
              <Link
                key={dest.name}
                to={`/packages?destination=${dest.name}`}
                className="group flex-shrink-0 w-[260px] sm:w-[300px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="relative h-[280px] sm:h-[320px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-xl tracking-tight">{dest.name}</h3>
                    <p className="text-teal-300 text-sm mt-0.5">{dest.count} package{dest.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function Home() {
  const [packages, setPackages] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [activePackageTab, setActivePackageTab] = useState('all');

  useEffect(() => {
    loadFeaturedPackages();
    loadPackages();
    loadDestinationCounts();
  }, []);

  const loadFeaturedPackages = async () => {
    try {
      const data = await packageService.getFeaturedPackages();
      setFeaturedPackages(data || []);
    } catch (err) {
      console.error('Failed to load featured packages', err);
    }
  };

  const loadPackages = async () => {
    try {
      const data = await packageService.getAll();
      setPackages(data);
    } catch (err) {
      console.error('Failed to load packages', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDestinationCounts = async () => {
    try {
      const counts = await packageService.getDestinationCounts();
      const mapped = counts.map((item) => ({
        name: item.destination,
        count: item.count,
        image: destinationImages[item.destination] || '',
      }));
      setDestinations(mapped);
    } catch (err) {
      console.error('Failed to load destination counts', err);
    }
  };

  const categories = [
    { icon: '🏖️', name: 'Beach', desc: 'Coastal paradise', slug: 'beach' },
    { icon: '⛰️', name: 'Mountains', desc: 'Alpine adventures', slug: 'mountain' },
    { icon: '🏛️', name: 'Heritage', desc: 'Cultural tours', slug: 'heritage' },
    { icon: '🌊', name: 'Adventure', desc: 'Thrilling activities', slug: 'adventure' },
    { icon: '🕌', name: 'Pilgrimage', desc: 'Spiritual journeys', slug: 'pilgrimage' },
    { icon: '🌴', name: 'Weekend', desc: 'Short getaways', slug: 'weekend' },
  ];

  const destinationImages = {
    'Shimla': `${BACKEND_ORIGIN}/images/packages/shimla-heritage-trail.jpg`,
    'Goa': `${BACKEND_ORIGIN}/images/packages/goa-beach-paradise.jpg`,
    'Manali': `${BACKEND_ORIGIN}/images/packages/manali-snow-adventure.jpg`,
    'Kedarnath': `${BACKEND_ORIGIN}/images/packages/kedarnath-dham-yatra.jpg`,
    'Kerala': `${BACKEND_ORIGIN}/images/packages/kerala-backwaters.jpg`,
    'Rajasthan': `${BACKEND_ORIGIN}/images/packages/royal-rajasthan.jpg`,
    'Kashmir': `${BACKEND_ORIGIN}/images/packages/kashmir-paradise.jpg`,
    'Andaman': `${BACKEND_ORIGIN}/images/packages/andaman-island-hopping.jpg`,
    'Leh Ladakh': `${BACKEND_ORIGIN}/images/packages/leh-ladakh-road-trip.jpg`,
    'Rishikesh': `${BACKEND_ORIGIN}/images/packages/rishikesh-adventure.jpg`,
  };

  const scrollFeatured = (direction) => {
    const container = document.getElementById('featured-scroll');
    if (!container) return;
    const scrollAmount = 340;
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setScrollIndex(Math.max(0, scrollIndex - 1));
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setScrollIndex(Math.min(packages.length - 1, scrollIndex + 1));
    }
  };

  const packageTabs = [
    { id: 'all', label: 'All Packages' },
    { id: 'group_tours', label: 'Group Tours' },
    { id: 'family_tours', label: 'Family Tours' },
    { id: 'pilgrimage', label: 'Pilgrimage' },
    { id: 'weekend_trips', label: 'Weekend Trips' },
  ];

  const filteredTabPackages = activePackageTab === 'all'
    ? packages
    : packages.filter(pkg => pkg.category === activePackageTab);

  return (
    <div className="travel-ui">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-800 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/60 to-emerald-900/80" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            Discover Your Next
            <span className="block text-teal-300">Great Adventure</span>
          </h1>
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
            Explore handcrafted tour packages across India. From serene mountains to sun-kissed beaches, your perfect journey awaits.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex-1 flex items-center px-5">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search destinations, packages..."
                  className="w-full px-4 py-4 text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </div>
              <Link to="/packages">
                <button className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">
                  Explore
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Packages - Horizontal Scroll */}
      <section className="py-20 bg-teal-50/50 dark:bg-dark-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-2 tracking-tight">
                Featured Packages
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                Handpicked experiences for unforgettable journeys
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scrollFeatured('left')}
                className="p-3 rounded-full bg-white dark:bg-dark-bg-secondary border border-teal-200 dark:border-dark-border text-teal-600 hover:bg-teal-50 dark:hover:bg-dark-bg shadow-sm transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollFeatured('right')}
                className="p-3 rounded-full bg-teal-600 text-white hover:bg-teal-700 shadow-md transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : (
            <div
              id="featured-scroll"
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {featuredPackages.map((pkg) => (
                <Link
                  key={pkg.id}
                  to={`/packages/${pkg.id}`}
                  className="flex-shrink-0 w-[300px] sm:w-[340px] group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <Card hover className="h-full overflow-hidden rounded-2xl">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getImageUrl(pkg.bannerImage)}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <Badge variant="accent" className="absolute top-3 left-3">
                        Featured #{pkg.featuredRank}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 dark:text-dark-text-primary text-lg mb-2">
                        {pkg.title}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-secondary text-sm mb-3">
                        <MapPin className="w-4 h-4" />
                        {pkg.destination}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Starting from</p>
                          <p className="text-xl font-bold text-teal-600">₹{pkg.price?.toLocaleString()}</p>
                        </div>
                        <Link
                          to={`/packages/${pkg.id}`}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white dark:bg-dark-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-3 tracking-tight">
              Browse by Category
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Find the perfect trip that matches your travel style
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.name} to={`/packages?category=${cat.slug}`}>
                <div className="bg-white rounded-2xl border border-teal-100/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 py-8 text-center">
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                    {cat.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Destinations — horizontal scroll carousel */}
      <DestinationsCarousel destinations={destinations} />

      {/* Package Tabs */}
      <section className="py-20 bg-white dark:bg-dark-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-3 tracking-tight">
              Explore Our Packages
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Find the perfect package for your next getaway
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {packageTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePackageTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activePackageTab === tab.id
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                    : 'bg-gray-100 dark:bg-dark-bg-secondary text-gray-600 dark:text-dark-text-secondary hover:bg-teal-100 dark:hover:bg-dark-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : filteredTabPackages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-dark-text-secondary">
              No packages found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTabPackages.slice(0, 6).map((pkg) => (
                <Link key={pkg.id} to={`/packages/${pkg.id}`} className="group block h-full">
                  <div className="h-full bg-white dark:bg-dark-bg-secondary rounded-2xl overflow-hidden border border-teal-100/60 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getImageUrl(pkg.bannerImage)}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <Badge variant="accent" className="absolute top-3 left-3">
                        {pkg.durationDays} Days
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 dark:text-dark-text-primary text-lg mb-2 tracking-tight">
                        {pkg.title}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-secondary text-sm mb-3">
                        <MapPin className="w-4 h-4" />
                        {pkg.destination}
                      </div>
                      <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-4 line-clamp-2">
                        {pkg.description}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-teal-100/60 dark:border-dark-border">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Starting from</p>
                          <p className="text-xl font-bold text-teal-600">₹{pkg.price?.toLocaleString()}</p>
                        </div>
                        <span className="px-4 py-2 bg-teal-600 group-hover:bg-teal-700 text-white text-sm rounded-lg transition-colors">
                          Explore
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/packages">
              <Button variant="pill" size="lg">
                View All Packages
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-teal-900 dark:bg-dark-bg-primary/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Get In Touch
            </h2>
            <p className="text-teal-200">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="!bg-white/10 !backdrop-blur-sm !border-teal-700 text-white rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-600 rounded-xl">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Our Address</h3>
                  <p className="text-teal-100 text-sm leading-relaxed">
                    Law Gate, Phagwara<br />
                    Punjab, 144411<br />
                    India
                  </p>
                </div>
              </div>
            </Card>

            <Card className="!bg-white/10 !backdrop-blur-sm !border-teal-700 text-white rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-600 rounded-xl">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Call Us</h3>
                  <p className="text-teal-100 text-sm leading-relaxed">
                    +91 7992336832
                  </p>
                  <p className="text-teal-200 text-xs mt-1">
                    Available Mon-Sat, 9 AM - 7 PM
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-teal-50 dark:bg-dark-bg-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-3 tracking-tight">
            Stay Updated
          </h2>
          <p className="text-gray-600 dark:text-dark-text-secondary mb-8">
            Subscribe to our newsletter for exclusive deals and travel inspiration.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 rounded-xl border border-teal-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Button variant="primary" className="rounded-xl px-6">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

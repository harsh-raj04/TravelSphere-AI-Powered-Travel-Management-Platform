import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Star, MapPin, Users, Clock, Shield, Zap, TrendingUp, MessageCircle } from 'lucide-react';

export function Home() {
  const [filters, setFilters] = useState({
    destination: '',
    startDate: '',
    budget: '',
  });

  const featured = [
    {
      id: 1,
      title: 'Himachal Escape',
      location: 'Himachal Pradesh',
      duration: 5,
      price: 18999,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
      rating: 4.8,
      reviews: 234,
    },
    {
      id: 2,
      title: 'Goa Weekend Retreat',
      location: 'Goa',
      duration: 3,
      price: 11999,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop',
      rating: 4.6,
      reviews: 187,
    },
    {
      id: 3,
      title: 'Kerala Backwaters',
      location: 'Kerala',
      duration: 4,
      price: 15999,
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&h=300&fit=crop',
      rating: 4.9,
      reviews: 312,
    },
    {
      id: 4,
      title: 'Rajasthan Royal Tour',
      location: 'Rajasthan',
      duration: 6,
      price: 21999,
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&h=300&fit=crop',
      rating: 4.7,
      reviews: 256,
    },
  ];

  const categories = [
    { icon: '🏖️', name: 'Beach', desc: 'Coastal paradise' },
    { icon: '⛰️', name: 'Mountains', desc: 'Alpine adventures' },
    { icon: '🎸', name: 'Adventure', desc: 'Thrilling activities' },
    { icon: '👑', name: 'Luxury', desc: 'Premium stays' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Agents',
      desc: 'All travel agents are carefully verified and trusted',
    },
    {
      icon: TrendingUp,
      title: 'Best Pricing',
      desc: 'Compare and book the best deals available',
    },
    {
      icon: Zap,
      title: 'Easy Booking',
      desc: 'Simple, fast, and secure booking process',
    },
    {
      icon: MessageCircle,
      title: 'Support 24/7',
      desc: 'Round-the-clock customer support',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-[#ff6a00] via-[#ff7f27] to-[#ff8f3a] overflow-hidden">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 flex flex-col justify-center min-h-screen">
          {/* Hero Content */}
          <div className="text-center text-white mb-12 animate-slide-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Explore India and Beyond
            </h1>
            <p className="text-xl sm:text-2xl text-sky-100 mb-8 max-w-2xl mx-auto">
              Handcrafted tour packages for every kind of traveler
            </p>
          </div>

          {/* Search Card */}
          <Card variant="glass" className="max-w-3xl mx-auto w-full p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Input
                placeholder="Where to travel?"
                value={filters.destination}
                onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                className="bg-white/90 dark:bg-dark-bg-secondary"
              />
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="bg-white/90 dark:bg-dark-bg-secondary"
              />
              <Input
                placeholder="Budget (₹)"
                type="number"
                value={filters.budget}
                onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                className="bg-white/90 dark:bg-dark-bg-secondary"
              />
            </div>
            <Link to="/packages" className="block">
              <Button variant="primary" size="lg" fullWidth className="rounded-full shadow-lg shadow-orange-200/60">
                Explore Packages
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-20 bg-gradient-to-b from-light-bg-primary to-light-bg-secondary/40 dark:from-dark-bg-primary dark:to-dark-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
              Featured Packages
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg">
              Handpicked experiences for unforgettable journeys
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((pkg) => (
              <Link key={pkg.id} to={`/packages/${pkg.id}`}>
                <Card variant="elevated" hover className="h-full overflow-hidden">
                  {/* Image */}
                  <div className="relative mb-4 overflow-hidden rounded-lg h-48">
                    <img
                      src={pkg.image}
                      alt={pkg.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 right-3" variant="primary">
                      ⭐ {pkg.rating}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary text-lg">
                      {pkg.title}
                    </h3>
                    <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary text-sm">
                      <MapPin className="w-4 h-4" />
                      {pkg.location}
                    </div>
                    <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary text-sm">
                      <Clock className="w-4 h-4" />
                      {pkg.duration} days
                    </div>
                    <div className="pt-3 border-t border-light-border dark:border-dark-border">
                      <p className="text-2xl font-bold text-brand-primary dark:text-brand-secondary mb-3">
                        ₹{pkg.price.toLocaleString()}
                      </p>
                      <Button variant="secondary" size="sm" fullWidth>
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-light-bg-secondary dark:bg-dark-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
              Browse by Category
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg">
              Choose your adventure type
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Card key={cat.name} variant="elevated" hover className="text-center py-8">
                <div className="text-5xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                  {cat.name}
                </h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {cat.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why TravelSphere */}
      <section className="py-20 bg-gradient-to-b from-light-bg-primary to-light-bg-secondary/40 dark:from-dark-bg-primary dark:to-dark-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
              Why Choose TravelSphere?
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg">
              The smarter way to book travel packages
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} variant="elevated" className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 rounded-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {feature.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready for your next adventure?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of travelers discovering amazing experiences
          </p>
          <Link to="/packages">
            <Button variant="secondary" size="lg">
              Start Exploring
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { packagesAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MapPin, Clock, Star, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export function PackageListing() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    destination: '',
    maxPrice: 50000,
    minDuration: 0,
    maxDuration: 30,
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await packagesAPI.list({
        page: 1,
        limit: 12,
      });
      setPackages(res.data.data.items || []);
    } catch (err) {
      console.error('Failed to load packages', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesDestination =
      !filters.destination ||
      pkg.destination?.toLowerCase().includes(filters.destination.toLowerCase()) ||
      pkg.title?.toLowerCase().includes(filters.destination.toLowerCase());

    const matchesPrice = pkg.price <= filters.maxPrice;
    const matchesDuration =
      pkg.durationDays >= filters.minDuration && pkg.durationDays <= filters.maxDuration;

    return matchesDestination && matchesPrice && matchesDuration;
  });

  return (
    <div className="min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Explore Packages
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg">
            Discover {packages.length} amazing travel experiences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="p-6 space-y-6 sticky top-20">
              <div>
                <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
                  Filters
                </h3>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                  Search Destination
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
                  <input
                    type="text"
                    placeholder="City, country..."
                    value={filters.destination}
                    onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
                  Max Price: ₹{filters.maxPrice.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                  className="w-full accent-brand-primary"
                />
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-2">
                  Up to ₹100,000
                </p>
              </div>

              {/* Duration Range */}
              <div>
                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
                  Duration: {filters.minDuration} - {filters.maxDuration} days
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={filters.minDuration}
                    onChange={(e) => setFilters({ ...filters, minDuration: parseInt(e.target.value) })}
                    className="w-full accent-brand-primary"
                  />
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={filters.maxDuration}
                    onChange={(e) => setFilters({ ...filters, maxDuration: parseInt(e.target.value) })}
                    className="w-full accent-brand-primary"
                  />
                </div>
              </div>

              {/* Reset Filters */}
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() =>
                  setFilters({
                    destination: '',
                    maxPrice: 50000,
                    minDuration: 0,
                    maxDuration: 30,
                  })
                }
              >
                Reset Filters
              </Button>
            </Card>
          </div>

          {/* Packages Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-16">
                <div className="text-light-text-secondary dark:text-dark-text-secondary">
                  Loading packages...
                </div>
              </div>
            ) : filteredPackages.length === 0 ? (
              <Card variant="elevated" className="p-16 text-center">
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
                  No packages found matching your criteria
                </p>
                <Button
                  onClick={() =>
                    setFilters({
                      destination: '',
                      maxPrice: 50000,
                      minDuration: 0,
                      maxDuration: 30,
                    })
                  }
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPackages.map((pkg) => (
                  <Link key={pkg.id} to={`/packages/${pkg.id}`}>
                    <Card variant="elevated" hover className="h-full overflow-hidden flex flex-col">
                      {/* Image Container */}
                      <div className="relative mb-4 overflow-hidden rounded-lg h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-bg-tertiary dark:to-dark-border">
                        <div className="w-full h-full bg-gradient-brand opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-brand-primary opacity-50" />
                        </div>
                        <Badge className="absolute top-3 right-3 bg-white dark:bg-dark-bg-secondary">
                          ⭐ {typeof pkg.rating === 'number' ? pkg.rating.toFixed(1) : 4.5}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div>
                          <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary text-lg mb-1">
                            {pkg.title}
                          </h3>
                          <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary text-sm">
                            <MapPin className="w-4 h-4" />
                            {pkg.destination}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary text-sm">
                          <Clock className="w-4 h-4" />
                          {pkg.durationDays} days {pkg.durationDays > 1 ? '& nights' : '& night'}
                        </div>

                        <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary line-clamp-2">
                          {pkg.description}
                        </p>

                        {/* Footer */}
                        <div className="mt-auto pt-4 border-t border-light-border dark:border-dark-border">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
                                Starting from
                              </p>
                              <p className="text-2xl font-bold text-brand-primary dark:text-brand-secondary">
                                ₹{pkg.price?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                            <Badge variant="success" size="sm">
                              /person
                            </Badge>
                          </div>
                          <Button variant="secondary" size="sm" fullWidth>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

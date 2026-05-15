import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Clock, Filter, Loader2, Grid3X3, List, Star } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { packageService, getImageUrl } from '../services/packageService';

export function Packages() {
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    destination: searchParams.get('destination') || '',
  });

  useEffect(() => {
    loadPackages();
  }, []);

  // Sync filters when URL params change (e.g. clicking navbar category links)
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      destination: searchParams.get('destination') || '',
    });
  }, [searchParams]);

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

  const filtered = packages.filter((pkg) => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const matchesSearch =
        pkg.title.toLowerCase().includes(s) ||
        pkg.destination.toLowerCase().includes(s) ||
        pkg.description.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }
    if (filters.category && pkg.category !== filters.category) return false;
    if (filters.destination && pkg.destination !== filters.destination) return false;
    return true;
  });

  const categories = [
    { value: '', label: 'All' },
    { value: 'group_tours', label: 'Group Tours' },
    { value: 'family_tours', label: 'Family Tours' },
    { value: 'pilgrimage', label: 'Pilgrimage' },
    { value: 'weekend_trips', label: 'Weekend Trips' },
  ];

  return (
    <div className="travel-ui min-h-screen bg-teal-50/30 dark:bg-dark-bg-primary">
      {/* Header */}
      <section className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Explore Packages</h1>
          <p className="text-teal-100 text-lg">Discover your perfect travel experience</p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white dark:bg-dark-bg-secondary border-b border-gray-100 dark:border-dark-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFilters({ ...filters, category: cat.value })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      filters.category === cat.value
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text-secondary hover:bg-teal-100 dark:hover:bg-dark-border'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-dark-bg text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-dark-bg text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-dark-text-primary mb-2">No packages found</h3>
              <p className="text-gray-500 dark:text-dark-text-secondary mb-4">Try adjusting your search or filters</p>
              <Button variant="secondary" onClick={() => setFilters({ search: '', category: '', destination: '' })}>
                Clear Filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((pkg) => (
                <PackageListItem key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="text-center mt-8 text-sm text-gray-500 dark:text-dark-text-secondary">
              Showing {filtered.length} package{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PackageCard({ pkg }) {
  return (
    <Link to={`/packages/${pkg.id}`} className="group block h-full">
      <div className="h-full bg-white dark:bg-dark-bg-secondary rounded-2xl overflow-hidden border border-teal-100/60 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="relative h-52 overflow-hidden">
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
          <h3 className="font-bold text-gray-900 dark:text-dark-text-primary text-lg mb-1 tracking-tight">
            {pkg.title}
          </h3>
          <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-secondary text-sm mb-3">
            <MapPin className="w-4 h-4" />
            {pkg.destination}
          </div>
          <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-4 line-clamp-2">
            {pkg.description}
          </p>
          <div className="flex items-center justify-between border-t border-teal-100/60 dark:border-dark-border pt-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-dark-text-secondary">Starting from</p>
              <p className="text-xl font-bold text-teal-600">₹{pkg.price?.toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {pkg.rating ? (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {pkg.rating.toFixed(1)}
                </span>
              ) : (
                <span className="text-xs text-gray-400">New</span>
              )}
              <span className="px-4 py-2 bg-teal-600 group-hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors">
                View Details
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PackageListItem({ pkg }) {
  return (
    <Link to={`/packages/${pkg.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-dark-bg-secondary border border-teal-100/60 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-64 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
            <img
              src={getImageUrl(pkg.bannerImage)}
              alt={pkg.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-dark-text-primary text-lg">{pkg.title}</h3>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-secondary text-sm">
                    <MapPin className="w-4 h-4" />
                    {pkg.destination}
                    <span className="mx-1">•</span>
                    <Clock className="w-4 h-4" />
                    {pkg.durationDays} days
                  </div>
                </div>
                <Badge variant="primary">{pkg.category?.replace('_', ' ')}</Badge>
              </div>
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm line-clamp-2 mb-3">
                {pkg.description}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Starting from</p>
                <p className="text-2xl font-bold text-teal-600">₹{pkg.price?.toLocaleString()}</p>
              </div>
              <Button variant="primary">
                Explore Package
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

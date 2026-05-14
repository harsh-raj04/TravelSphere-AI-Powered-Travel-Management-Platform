import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { packagesAPI, agentAPI } from '../../services/api';
import { getImageUrl } from '../../services/packageService';
import { MapPin, Calendar, Users, IndianRupee, Search, Filter, Eye, Image } from 'lucide-react';
import { PageSpinner } from '../../components/ui/LoadingSpinner';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Package card with real image ─────────────────────────────────────────────
function PackageBrowseCard({ pkg, hasApplied, onViewDetails }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = pkg.bannerImage ? getImageUrl(pkg.bannerImage) : null;

  return (
    <div className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white border border-gray-200">
      {/* Image / fallback header */}
      <div className="relative h-48 overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Image className="w-10 h-10 text-white/60" />
          </div>
        )}

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Title + destination on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-bold leading-tight mb-0.5">{pkg.title}</h3>
          <div className="flex items-center gap-1.5 text-sm text-white/90">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{pkg.destination}</span>
          </div>
        </div>

        {/* "Already Applied" badge */}
        {hasApplied && (
          <div className="absolute top-3 right-3">
            <Badge variant="success" className="shadow-md">
              Already Applied
            </Badge>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        {/* Duration + Price stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Duration</p>
            <p className="text-2xl font-bold text-gray-900">{pkg.durationDays}D</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Price</p>
            <p className="text-2xl font-bold text-green-600">{formatINR(pkg.price)}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-5 line-clamp-2">{pkg.description}</p>

        {/* CTA */}
        <Button
          onClick={onViewDetails}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Details
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function AgentPackagesBrowse() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgRes, appRes] = await Promise.all([
        packagesAPI.list({ page: 1, limit: 100 }),
        agentAPI.myPackageInterests(),
      ]);
      setPackages(pkgRes.data?.data?.items || []);
      setApplications(appRes.data?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load packages');
      setPackages([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const appliedPackageIds = useMemo(
    () => new Set((applications || []).map((app) => app.packageId || app.package?.id)),
    [applications]
  );

  const destinations = useMemo(
    () => [...new Set((packages || []).map((pkg) => pkg.destination).filter(Boolean))],
    [packages]
  );

  const filteredPackages = useMemo(() => {
    return (packages || []).filter((pkg) => {
      const matchesSearch =
        pkg.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.destination?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDestination = !destinationFilter || pkg.destination === destinationFilter;
      return matchesSearch && matchesDestination && pkg.isActive;
    });
  }, [packages, searchTerm, destinationFilter]);

  const stats = useMemo(() => ({
    total: packages.length,
    applied: applications.length,
    avgPrice: packages.length > 0
      ? Math.round(packages.reduce((sum, pkg) => sum + Number(pkg.price || 0), 0) / packages.length)
      : 0,
  }), [packages, applications]);

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover Packages</h1>
        <p className="text-gray-600">Browse and opt into travel packages to start earning as an agent</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Available" value={filteredPackages.length} variant="blue" />
        <StatCard icon={Calendar} label="You've Applied" value={applications.length} variant="green" />
        <StatCard icon={IndianRupee} label="Avg Package" value={formatINR(stats.avgPrice)} variant="purple" />
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Destinations</option>
            {destinations.map((dest) => (
              <option key={dest} value={dest}>
                {dest}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <PageSpinner />
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No packages found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageBrowseCard
              key={pkg.id}
              pkg={pkg}
              hasApplied={appliedPackageIds.has(pkg.id)}
              onViewDetails={() => navigate(`/agent/packages/${pkg.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

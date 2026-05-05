import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColorfulCard } from '../../components/ui/ColorfulCard';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { packagesAPI, agentAPI } from '../../services/api';
import { MapPin, Calendar, Users, IndianRupee, Search, Filter, Eye } from 'lucide-react';

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

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
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No packages found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const hasApplied = appliedPackageIds.has(pkg.id);
            return (
              <div
                key={pkg.id}
                className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white border border-gray-200"
              >
                {/* Header with gradient */}
                <div className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-2 right-2 w-24 h-24 bg-white rounded-full blur-3xl" />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{pkg.title}</h3>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{pkg.destination}</span>
                      </div>
                    </div>
                    {hasApplied && (
                      <Badge variant="success" className="self-start">
                        Already Applied
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Duration</p>
                      <p className="text-2xl font-bold text-gray-900">{pkg.durationDays}D</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Price</p>
                      <p className="text-2xl font-bold text-green-600">{formatINR(pkg.price)}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-6 line-clamp-2">{pkg.description}</p>

                  {/* Button */}
                  <Button
                    onClick={() => navigate(`/agent/packages/${pkg.id}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

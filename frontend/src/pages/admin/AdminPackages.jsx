import { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Plus, X, AlertCircle, Edit, ExternalLink, ChevronDown, Trash2, MapPin, Clock, Search, ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { getImageUrl } from '../../services/packageService';
import { PageSpinner } from '../../components/ui/LoadingSpinner';

const PAGE_SIZE = 20;

const blankDraft = () => ({
  title: '',
  destination: '',
  durationDays: 1,
  price: '',
  description: '',
  category: 'group_tours',
  tripStyle: '',
  bannerImage: '',
  isActive: true,
  itineraries: [],
  pricingOptions: [],
  departures: [],
  inclusions: [],
  addOns: [],
});

export function AdminPackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [openFeature, setOpenFeature] = useState(null);
  const [form, setForm] = useState(blankDraft());
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    const loadPackages = async () => {
      setLoading(true);
      try {
        const params = { page, limit: PAGE_SIZE };
        if (debouncedSearch) params.search = debouncedSearch;
        const packagesRes = await adminAPI.packages(params);
        const items = packagesRes.data?.data?.items || [];
        const total = packagesRes.data?.data?.pagination?.total || 0;

        const withRatings = await Promise.all(
          items.map(async (pkg) => {
            try {
              const detailRes = await adminAPI.getPackage(pkg.id);
              return { ...pkg, rating: detailRes.data?.data?.rating, reviewCount: detailRes.data?.data?.reviewCount };
            } catch {
              return { ...pkg, rating: null, reviewCount: 0 };
            }
          }),
        );

        if (!cancelled) {
          setPackages(withRatings);
          setTotalItems(total);
        }
      } catch {
        if (!cancelled) setPackages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPackages();
    return () => { cancelled = true; };
  }, [page, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const openCreateModal = () => {
    setCreateError('');
    setForm(blankDraft());
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateOpen(false);
    setCreateError('');
  };

  const updateDraftField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateArrayDraft = (field, index, key, value) => {
    setForm((prev) => {
      const arr = [...prev[field]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [field]: arr };
    });
  };
  const addArrayRow = (field, template) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], { ...template }] }));
  };
  const removeArrayRow = (field, index) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleDurationChange = (value) => {
    const nextDur = Math.max(1, Number(value) || 1);
    const currentLen = form.itineraries.length;
    setForm((prev) => {
      if (nextDur > currentLen) {
        const add = Array.from({ length: nextDur - currentLen }, (_, i) => ({
          dayNumber: currentLen + i + 1,
          title: '',
          description: '',
          morningActivity: '',
          afternoonActivity: '',
          eveningActivity: '',
          nightActivity: '',
          locations: [],
          activities: [],
        }));
        return { ...prev, durationDays: nextDur, itineraries: [...prev.itineraries, ...add] };
      }
      return { ...prev, durationDays: nextDur, itineraries: prev.itineraries.slice(0, nextDur) };
    });
  };

  const submitCreatePackage = async (event) => {
    event.preventDefault();
    setCreateError('');
    if (!form.title.trim() || !form.description.trim() || !form.destination.trim()) {
      setCreateError('Title, description, and destination are required.'); return;
    }
    const priceVal = Number(form.price);
    if (!Number.isFinite(priceVal) || priceVal <= 0) {
      setCreateError('Price must be positive.'); return;
    }
    if (!Number.isInteger(form.durationDays) || form.durationDays < 1) {
      setCreateError('Duration must be at least 1 day.'); return;
    }

    setIsCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        destination: form.destination.trim(),
        durationDays: form.durationDays,
        price: priceVal,
        category: form.category,
        tripStyle: form.tripStyle || undefined,
        bannerImage: form.bannerImage || undefined,
        itineraries: form.itineraries.map((it) => ({
          dayNumber: it.dayNumber,
          title: it.title || '',
          description: it.description || null,
          morningActivity: it.morningActivity || null,
          afternoonActivity: it.afternoonActivity || null,
          eveningActivity: it.eveningActivity || null,
          nightActivity: it.nightActivity || null,
          locations: it.locations || [],
          activities: it.activities || [],
        })),
        pricingOptions: form.pricingOptions,
        departures: form.departures.map((d) => ({
          departureDate: d.departureDate || null,
          availableSeats: d.availableSeats || 20,
          price: Number(d.price) || priceVal,
          isActive: d.isActive !== false,
        })),
        inclusions: form.inclusions.filter((inc) => inc.description.trim()),
        addOns: form.addOns.filter((ao) => ao.title.trim()),
      };

      const res = await adminAPI.createPackage(payload);
      const created = res.data?.data;
      if (created) {
        setPackages((prev) => [created, ...prev]);
      }
      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(err?.response?.data?.message || 'Failed to create package.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (pkg) => {
    try {
      const newState = !pkg.isActive;
      await adminAPI.togglePackageActive(pkg.id, { is_active: newState });
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, isActive: newState } : p)));
    } catch { /* silently fail */ }
  };

  const handleFeatureRank = async (pkg, rank) => {
    try {
      await adminAPI.featurePackage(pkg.id, { featured_rank: rank });
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, featuredRank: rank } : p)));
      setOpenFeature(null);
    } catch { /* silently fail */ }
  };

  const featuredCount = packages.filter((p) => p.featuredRank).length; // count on current page

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Package Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage travel packages and featured content</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
            >Grid</button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
            >Table</button>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search packages by title, destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {loading && <PageSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Packages</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalItems}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Featured</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{featuredCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{packages.filter((p) => p.isActive).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{packages.reduce((sum, p) => sum + (p._count?.bookings || 0), 0)}</p>
        </div>
      </div>

      {viewMode === 'grid' && !loading && packages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageOpen className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
            {debouncedSearch ? 'No packages found' : 'No packages yet'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {debouncedSearch
              ? `No results for "${debouncedSearch}". Try a different search.`
              : 'Get started by creating your first travel package.'}
          </p>
          {debouncedSearch ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 text-sm font-medium text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Package
            </button>
          )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 relative">
                {pkg.bannerImage ? (
                  <img src={getImageUrl(pkg.bannerImage)} alt={pkg.title} className="h-48 w-full object-cover" />
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-teal-600 to-teal-400" />
                )}
                {pkg.featuredRank && (
                  <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Featured #{pkg.featuredRank}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">{pkg.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.destination || 'Destination flexible'}</p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(pkg)}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ml-2 ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    title={pkg.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {pkg.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="text-gray-900 dark:text-white font-medium">{pkg.rating?.toFixed(1) || '—'}</span>
                    {pkg.reviewCount > 0 && <span className="text-gray-500 text-xs">({pkg.reviewCount})</span>}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">{pkg._count?.bookings || 0} bookings</div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{pkg.durationDays} Days</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{Number(pkg.price || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/packages/${pkg.id}`)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setOpenFeature(openFeature === pkg.id ? null : pkg.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${pkg.featuredRank ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${pkg.featuredRank ? 'fill-current' : ''}`} />
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {openFeature === pkg.id && (
                        <div className="absolute bottom-full right-0 mb-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1">
                          <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Featured Rank</p>
                          {[1, 2, 3, 4, 5, 6, 7].map((rank) => (
                            <button
                              key={rank}
                              onClick={() => handleFeatureRank(pkg, rank)}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${pkg.featuredRank === rank ? 'text-amber-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                            >
                              Rank #{rank}
                            </button>
                          ))}
                          {pkg.featuredRank && (
                            <button
                              onClick={() => handleFeatureRank(pkg, null)}
                              className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700 mt-1 pt-2"
                            >
                              Remove from Featured
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {!loading && packages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <PackageOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {debouncedSearch ? `No packages match "${debouncedSearch}"` : 'No packages yet'}
                      </p>
                      {debouncedSearch ? (
                        <button onClick={() => setSearchTerm('')} className="mt-2 text-sm text-teal-600 hover:underline">Clear search</button>
                      ) : (
                        <button onClick={openCreateModal} className="mt-2 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline"><Plus className="w-3.5 h-3.5" /> Add Package</button>
                      )}
                    </td>
                  </tr>
                )}
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{pkg.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.destination || 'Destination flexible'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pkg.durationDays} Days</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">₹{Number(pkg.price || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{pkg.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {pkg.featuredRank ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">
                          <Star className="w-3 h-3 fill-current" />
                          #{pkg.featuredRank}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(pkg)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'} transition-colors`}
                      >
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/admin/packages/${pkg.id}`)} className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalItems)}–{Math.min(page * PAGE_SIZE, totalItems)} of {totalItems} packages
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const num = start + i;
              return num <= totalPages ? (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    num === page
                      ? 'bg-teal-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {num}
                </button>
              ) : null;
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Package</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Full package details with itinerary, pricing, departures</p>
              </div>
              <button onClick={closeCreateModal} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitCreatePackage} className="p-6 space-y-5">
              {createError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" /><span>{createError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input type="text" value={form.title} onChange={(e) => updateDraftField('title', e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="e.g. Kerala Backwaters" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Destination</label>
                  <input type="text" value={form.destination} onChange={(e) => updateDraftField('destination', e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="e.g. Kerala, India" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration (days)</label>
                  <input type="number" min="1" value={form.durationDays} onChange={(e) => handleDurationChange(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Starting Price (₹)</label>
                  <input type="number" min="1" step="0.01" value={form.price} onChange={(e) => updateDraftField('price', e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="12999" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tour Category</label>
                  <select value={form.category} onChange={(e) => updateDraftField('category', e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white">
                    <option value="group_tours">Group Tour</option>
                    <option value="family_tours">Family Tour</option>
                    <option value="weekend_trips">Weekend Trip</option>
                    <option value="pilgrimage">Pilgrimage</option>
                    <option value="personal_tours">Solo Tour</option>
                    <option value="couple_tours">Honeymoon / Couple</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trip Style <span className="text-gray-400 font-normal">(nature)</span></label>
                  <select value={form.tripStyle} onChange={(e) => updateDraftField('tripStyle', e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white">
                    <option value="">— Select style —</option>
                    <option value="beach">🏖️ Beach</option>
                    <option value="mountain">⛰️ Mountains</option>
                    <option value="adventure">🌊 Adventure</option>
                    <option value="calm">🧘 Calm & Wellness</option>
                    <option value="heritage">🏛️ Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image URL</label>
                  <input type="text" value={form.bannerImage} onChange={(e) => updateDraftField('bannerImage', e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea rows={4} value={form.description} onChange={(e) => updateDraftField('description', e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="Describe package highlights..." required />
              </div>

              {/* Itinerary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Itinerary</h3>
                  <button type="button" onClick={() => addArrayRow('itineraries', { dayNumber: form.itineraries.length + 1, title: '', description: '', morningActivity: '', afternoonActivity: '', eveningActivity: '', nightActivity: '', locations: [], activities: [] })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Day</button>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {form.itineraries.map((it, i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">Day {it.dayNumber}</span>
                        <button type="button" onClick={() => removeArrayRow('itineraries', i)} className="text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={it.title} onChange={(e) => updateArrayDraft('itineraries', i, 'title', e.target.value)} placeholder="Title" className="col-span-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                        <textarea value={it.description || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'description', e.target.value)} placeholder="Day description" rows={2} className="col-span-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white" />
                        <input value={it.morningActivity || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'morningActivity', e.target.value)} placeholder="Morning" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                        <input value={it.afternoonActivity || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'afternoonActivity', e.target.value)} placeholder="Afternoon" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                        <input value={it.eveningActivity || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'eveningActivity', e.target.value)} placeholder="Evening" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                        <input value={it.nightActivity || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'nightActivity', e.target.value)} placeholder="Night" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Pricing Options</h3>
                  <button type="button" onClick={() => addArrayRow('pricingOptions', { roomType: 'sharing', price: 0 })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.pricingOptions.map((po, i) => (
                    <div key={i} className="flex gap-2">
                      <select value={po.roomType} onChange={(e) => updateArrayDraft('pricingOptions', i, 'roomType', e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white">
                        <option value="sharing">Sharing</option>
                        <option value="triple">Triple</option>
                        <option value="double">Double</option>
                        <option value="single">Single</option>
                      </select>
                      <input type="number" value={po.price} onChange={(e) => updateArrayDraft('pricingOptions', i, 'price', Number(e.target.value))} placeholder="Price" className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      <button type="button" onClick={() => removeArrayRow('pricingOptions', i)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departures */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Departures</h3>
                  <button type="button" onClick={() => addArrayRow('departures', { departureDate: '', availableSeats: 20, price: Number(form.price) || 0, isActive: true })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.departures.map((d, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="date" value={d.departureDate} onChange={(e) => updateArrayDraft('departures', i, 'departureDate', e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      <input type="number" value={d.availableSeats} onChange={(e) => updateArrayDraft('departures', i, 'availableSeats', Number(e.target.value))} placeholder="Seats" className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      <input type="number" value={d.price} onChange={(e) => updateArrayDraft('departures', i, 'price', Number(e.target.value))} placeholder="Price" className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      <button type="button" onClick={() => removeArrayRow('departures', i)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions / Exclusions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Inclusions / Exclusions</h3>
                  <button type="button" onClick={() => addArrayRow('inclusions', { type: 'inclusion', description: '' })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.inclusions.map((inc, i) => (
                    <div key={i} className="flex gap-2">
                      <select value={inc.type} onChange={(e) => updateArrayDraft('inclusions', i, 'type', e.target.value)} className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white">
                        <option value="inclusion">Inclusion</option>
                        <option value="exclusion">Exclusion</option>
                      </select>
                      <input value={inc.description} onChange={(e) => updateArrayDraft('inclusions', i, 'description', e.target.value)} placeholder="Description" className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      <button type="button" onClick={() => removeArrayRow('inclusions', i)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-Ons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Add-Ons</h3>
                  <button type="button" onClick={() => addArrayRow('addOns', { title: '', description: '', price: 0 })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {form.addOns.map((ao, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={ao.title} onChange={(e) => updateArrayDraft('addOns', i, 'title', e.target.value)} placeholder="Title" className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      <input value={ao.description || ''} onChange={(e) => updateArrayDraft('addOns', i, 'description', e.target.value)} placeholder="Description" className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      <input type="number" value={ao.price} onChange={(e) => updateArrayDraft('addOns', i, 'price', Number(e.target.value))} placeholder="Price" className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white" />
                      <button type="button" onClick={() => removeArrayRow('addOns', i)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeCreateModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600" disabled={isCreating}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-70" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Package'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

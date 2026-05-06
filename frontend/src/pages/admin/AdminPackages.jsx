import { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Plus, X, AlertCircle, Edit, ExternalLink, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { getImageUrl } from '../../services/packageService';

export function AdminPackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [openFeature, setOpenFeature] = useState(null);
  const [form, setForm] = useState({
    title: '',
    destination: '',
    duration_days: '',
    price: '',
    description: '',
    category: 'group_tours',
    bannerImage: '',
    itinerary: [],
    image_urls: [''],
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const packagesRes = await adminAPI.packages({ page: 1, limit: 200 });
        const items = packagesRes.data?.data?.items || [];

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

        setPackages(withRatings);
      } catch {
        setPackages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCreateModal = () => {
    setCreateError('');
    setForm({
      title: '',
      destination: '',
      duration_days: '',
      price: '',
      description: '',
      category: 'group_tours',
      bannerImage: '',
      itinerary: [],
      image_urls: [''],
    });
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateOpen(false);
    setCreateError('');
  };

  const handleDurationChange = (value) => {
    const nextDuration = Math.max(1, Number(value) || 1);
    setForm((prev) => {
      const nextItinerary = Array.from({ length: nextDuration }, (_, index) => prev.itinerary[index] || '');
      return { ...prev, duration_days: String(nextDuration), itinerary: nextItinerary };
    });
  };

  const updateItineraryDay = (dayIndex, value) => {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((dayPlan, index) => (index === dayIndex ? value : dayPlan)),
    }));
  };

  const updateImageField = (index, value) => {
    setForm((prev) => ({
      ...prev,
      image_urls: prev.image_urls.map((item, idx) => (idx === index ? value : item)),
    }));
  };

  const addImageField = () => setForm((prev) => ({ ...prev, image_urls: [...prev.image_urls, ''] }));
  const removeImageField = (index) => {
    setForm((prev) => ({
      ...prev,
      image_urls: prev.image_urls.length <= 1 ? [''] : prev.image_urls.filter((_, idx) => idx !== index),
    }));
  };

  const submitCreatePackage = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!form.title.trim() || !form.description.trim()) { setCreateError('Please fill all required fields.'); return; }
    const durationDays = Number(form.duration_days);
    const priceValue = Number(form.price);
    if (!Number.isInteger(durationDays) || durationDays <= 0) { setCreateError('Duration must be a positive whole number.'); return; }
    if (!Number.isFinite(priceValue) || priceValue <= 0) { setCreateError('Price must be a positive number.'); return; }
    if (form.description.trim().length < 10) { setCreateError('Description must be at least 10 characters.'); return; }
    if (form.itinerary.length !== durationDays || form.itinerary.some((item) => !item.trim())) { setCreateError('Please provide itinerary details for each day.'); return; }

    setIsCreating(true);
    try {
      const imageUrls = form.image_urls.filter((url) => String(url || '').trim().length > 0);
      const payload = {
        title: form.title.trim(),
        destination: form.destination.trim() || undefined,
        duration_days: durationDays,
        price: priceValue,
        description: form.description.trim(),
        category: form.category,
        bannerImage: imageUrls[0] || undefined,
        itinerary: form.itinerary,
        image_urls: imageUrls,
      };

      const res = await adminAPI.createPackage(payload);
      const created = res.data?.data;
      if (created) {
        setPackages((prev) => [{ ...created, rating: null, reviewCount: 0 }, ...prev]);
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

  const featuredCount = packages.filter((p) => p.featuredRank).length;

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

      {loading && <div className="text-sm text-gray-500">Loading packages...</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Packages</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{packages.length}</p>
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
            <table className="w-full">
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

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Package</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create package details, itinerary, and gallery</p>
              </div>
              <button onClick={closeCreateModal} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitCreatePackage} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" /><span>{createError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="e.g. Kerala Backwaters" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Destination</label>
                  <input type="text" value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="e.g. Kerala" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration (days)</label>
                  <input type="number" min="1" value={form.duration_days} onChange={(e) => handleDurationChange(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="5" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                  <input type="number" min="1" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="12999" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white">
                    <option value="group_tours">Group Tour</option>
                    <option value="weekend_trips">Weekend Trip</option>
                    <option value="family_tours">Family Tour</option>
                    <option value="pilgrimage">Pilgrimage</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Banner Image URL</label>
                  <input type="text" value={form.bannerImage} onChange={(e) => setForm((p) => ({ ...p, bannerImage: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="Describe package highlights..." required />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Itinerary (dynamic by duration)</label>
                  <div className="mt-2 space-y-2 max-h-56 overflow-auto pr-1">
                    {(form.itinerary || []).map((dayPlan, index) => (
                      <div key={`day-${index}`}>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Day {index + 1}</label>
                        <input type="text" value={dayPlan} onChange={(e) => updateItineraryDay(index, e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder={`Plan for Day ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Package Images (URLs)</label>
                  <div className="mt-2 space-y-2">
                    {form.image_urls.map((url, index) => (
                      <div key={`img-${index}`} className="flex gap-2">
                        <input type="url" value={url} onChange={(e) => updateImageField(index, e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" placeholder="https://..." />
                        <button type="button" onClick={() => removeImageField(index)} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={addImageField} className="text-sm font-medium text-teal-600 hover:text-teal-700">+ Add another image</button>
                  </div>
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

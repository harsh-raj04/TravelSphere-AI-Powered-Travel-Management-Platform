import { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Plus, X, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';

export function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    title: '',
    destination: '',
    duration_days: '',
    price: '',
    description: '',
    itinerary: [],
    image_urls: [''],
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const packagesRes = await adminAPI.packages({ page: 1, limit: 200 });

        const mapped = (packagesRes.data?.data?.items || []).map((pkg) => ({
          ...pkg,
          active: pkg.isActive,
          bookingsCount: pkg._count?.bookings || 0,
          featured: false,
        }));

        setPackages(mapped);
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
      itinerary: [],
      image_urls: [''],
    });
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) {
      return;
    }
    setIsCreateOpen(false);
    setCreateError('');
  };

  const handleDurationChange = (value) => {
    const nextDuration = Math.max(1, Number(value) || 1);

    setForm((prev) => {
      const nextItinerary = Array.from({ length: nextDuration }, (_, index) => prev.itinerary[index] || '');
      return {
        ...prev,
        duration_days: String(nextDuration),
        itinerary: nextItinerary,
      };
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

  const addImageField = () => {
    setForm((prev) => ({
      ...prev,
      image_urls: [...prev.image_urls, ''],
    }));
  };

  const removeImageField = (index) => {
    setForm((prev) => ({
      ...prev,
      image_urls: prev.image_urls.length <= 1
        ? ['']
        : prev.image_urls.filter((_, idx) => idx !== index),
    }));
  };

  const submitCreatePackage = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!form.title.trim() || !form.description.trim()) {
      setCreateError('Please fill all required fields.');
      return;
    }

    const durationDays = Number(form.duration_days);
    const priceValue = Number(form.price);

    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      setCreateError('Duration must be a positive whole number.');
      return;
    }

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setCreateError('Price must be a positive number.');
      return;
    }

    if (form.description.trim().length < 10) {
      setCreateError('Description must be at least 10 characters.');
      return;
    }

    if (form.itinerary.length !== durationDays || form.itinerary.some((item) => !item.trim())) {
      setCreateError('Please provide itinerary details for each day.');
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        destination: form.destination.trim() || undefined,
        duration_days: durationDays,
        price: priceValue,
        description: form.description.trim(),
        itinerary: form.itinerary,
        image_urls: form.image_urls.filter((url) => String(url || '').trim().length > 0),
      };

      const res = await adminAPI.createPackage(payload);
      const created = res.data?.data;

      if (created) {
        setPackages((prev) => [{
          ...created,
          active: created.isActive,
          bookingsCount: created._count?.bookings || 0,
          featured: false,
        }, ...prev]);
      }

      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(err?.response?.data?.message || 'Failed to create package.');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleFeatured = (packageId) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, featured: !pkg.featured } : pkg)));
  };

  const toggleActive = (packageId) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === packageId ? { ...pkg, active: !pkg.active } : pkg)));
  };

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
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Table
            </button>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
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
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{packages.filter((p) => p.featured).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{packages.filter((p) => p.active).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{packages.reduce((sum, p) => sum + Number(p.bookingsCount || 0), 0)}</p>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 relative">
                {pkg.featured && (
                  <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{pkg.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.destination || 'Destination flexible'}</p>
                  </div>
                  <button
                    onClick={() => toggleActive(pkg.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      pkg.active
                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pkg.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="text-gray-900 dark:text-white font-medium">4.8</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">{pkg._count?.bookings || 0} bookings</div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{pkg.durationDays} Days</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{Number(pkg.price || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <button
                    onClick={() => toggleFeatured(pkg.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pkg.featured
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pkg.featured ? 'Featured' : 'Set Featured'}
                  </button>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {pkg.featured && <Star className="w-4 h-4 text-amber-500 fill-current" />}
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
                        <span className="text-sm font-medium text-gray-900 dark:text-white">4.8</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pkg._count?.bookings || 0}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(pkg.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${pkg.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}
                      >
                        {pkg.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleFeatured(pkg.id)} className="text-blue-500 hover:text-blue-600 font-medium text-sm mr-3">
                        {pkg.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button className="text-gray-500 hover:text-gray-600 font-medium text-sm">Edit</button>
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
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Package</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create package details, itinerary, and gallery</p>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitCreatePackage} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="e.g. Kerala Backwaters"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Destination (optional)</label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="e.g. Kerala"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.duration_days}
                    onChange={(event) => handleDurationChange(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="5"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="12999"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="Describe package highlights, inclusions, and travel experience."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Itinerary (dynamic by duration)</label>
                  <div className="mt-2 space-y-2 max-h-56 overflow-auto pr-1">
                    {(form.itinerary || []).map((dayPlan, index) => (
                      <div key={`day-${index}`}>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Day {index + 1}</label>
                        <input
                          type="text"
                          value={dayPlan}
                          onChange={(event) => updateItineraryDay(index, event.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                          placeholder={`Plan for Day ${index + 1}`}
                        />
                      </div>
                    ))}
                    {(form.itinerary || []).length === 0 && (
                      <p className="text-xs text-gray-500">Enter duration first to generate day-wise itinerary fields.</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Package Images (URLs)</label>
                  <div className="mt-2 space-y-2">
                    {form.image_urls.map((url, index) => (
                      <div key={`img-${index}`} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(event) => updateImageField(index, event.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Add another image
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

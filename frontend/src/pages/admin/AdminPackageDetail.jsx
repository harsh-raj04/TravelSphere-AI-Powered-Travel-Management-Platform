import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Star, Eye, EyeOff, ArrowLeft, Edit, Save, X, Plus, Trash2,
  TrendingUp, Calendar, MapPin, Clock, Users, IndianRupee, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { getImageUrl } from '../../services/packageService';
import { PageSpinner, LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function AdminPackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(searchParams.get('mode') === 'edit');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [tabData, setTabData] = useState({ history: null, agents: null, reviews: null });
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    fetchPackage();
  }, [id]);

  useEffect(() => {
    setEditMode(searchParams.get('mode') === 'edit');
  }, [searchParams]);

  const fetchPackage = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPackage(id);
      setPkg(res.data?.data);
    } catch {
      setError('Failed to load package');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab) => {
    setTabLoading(true);
    try {
      if (tab === 'history' && !tabData.history) {
        const res = await adminAPI.getPackageHistory(id);
        setTabData((prev) => ({ ...prev, history: res.data?.data }));
      } else if (tab === 'agents' && !tabData.agents) {
        const res = await adminAPI.getPackageAgents(id);
        setTabData((prev) => ({ ...prev, agents: res.data?.data?.items || [] }));
      } else if (tab === 'reviews' && !tabData.reviews) {
        const res = await adminAPI.getPackageReviews(id);
        setTabData((prev) => ({ ...prev, reviews: res.data?.data }));
      }
    } catch { /* ignore */ }
    setTabLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  const enterEditMode = () => {
    setDraft({
      title: pkg.title || '',
      description: pkg.description || '',
      destination: pkg.destination || '',
      durationDays: pkg.durationDays || 1,
      price: Number(pkg.price) || 0,
      category: pkg.category || 'group_tours',
      bannerImage: pkg.bannerImage || '',
      isActive: pkg.isActive,
      featuredRank: pkg.featuredRank ?? null,
      itineraries: (pkg.itineraries || []).map((it) => ({
        dayNumber: it.dayNumber,
        title: it.title || '',
        description: it.description || '',
        morningActivity: it.morningActivity || '',
        afternoonActivity: it.afternoonActivity || '',
        eveningActivity: it.eveningActivity || '',
        nightActivity: it.nightActivity || '',
        locations: Array.isArray(it.locations) ? it.locations : (typeof it.locations === 'string' ? JSON.parse(it.locations) : []),
        activities: Array.isArray(it.activities) ? it.activities : (typeof it.activities === 'string' ? JSON.parse(it.activities) : []),
      })),
      pricingOptions: (pkg.pricingOptions || []).map((po) => ({ roomType: po.roomType, price: Number(po.price) })),
      departures: (pkg.departures || []).map((d) => ({
        departureDate: d.departureDate ? new Date(d.departureDate).toISOString().slice(0, 10) : '',
        availableSeats: d.availableSeats || 20,
        price: Number(d.price) || 0,
        isActive: d.isActive !== undefined ? d.isActive : true,
      })),
      inclusions: (pkg.inclusions || []).map((inc) => ({ type: inc.type, description: inc.description })),
      addOns: (pkg.addOns || []).map((ao) => ({ title: ao.title, description: ao.description || '', price: Number(ao.price) })),
    });
    setEditMode(true);
  };

  const cancelEdit = () => { setEditMode(false); setDraft(null); };

  const updateDraftField = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const updateArrayDraft = (field, index, key, value) => {
    setDraft((prev) => {
      const arr = [...prev[field]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [field]: arr };
    });
  };

  const addArrayRow = (field, template) => {
    setDraft((prev) => ({ ...prev, [field]: [...prev[field], { ...template }] }));
  };

  const removeArrayRow = (field, index) => {
    setDraft((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...draft,
        addOns: draft.addOns.map((ao) => ({ ...ao, description: ao.description || null })),
      };
      const res = await adminAPI.updatePackage(id, payload);
      setPkg(res.data?.data);
      setEditMode(false);
      setDraft(null);
      setTabData({ history: null, agents: null, reviews: null });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const newState = !pkg.isActive;
      await adminAPI.togglePackageActive(pkg.id, { is_active: newState });
      setPkg((prev) => ({ ...prev, isActive: newState }));
    } catch { /* ignore */ }
  };

  const handleFeatureToggle = async (rank) => {
    try {
      await adminAPI.featurePackage(pkg.id, { featured_rank: rank });
      setPkg((prev) => ({ ...prev, featuredRank: rank }));
    } catch { /* ignore */ }
  };

  const tabs = [
    { id: 'details', label: 'Package Details' },
    { id: 'history', label: 'Booking History' },
    { id: 'agents', label: 'Agent Insights' },
    { id: 'reviews', label: 'Feedback' },
  ];

  if (loading) {
    return <PageSpinner />;
  }

  if (!pkg) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">Package not found</p>
        <button onClick={() => navigate('/admin/packages')} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">Back to Packages</button>
      </div>
    );
  }

  const statusBadge = (status) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-700', pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700', in_progress: 'bg-teal-100 text-teal-700',
      open_for_agents: 'bg-indigo-100 text-indigo-700', rejected: 'bg-red-100 text-red-700',
      closed: 'bg-gray-100 text-gray-700', accepted: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/packages')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{editMode && draft ? draft.title : pkg.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{pkg.destination || 'Flexible'}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{pkg.durationDays} Days</span>
              {pkg.rating && (
                <span className="text-sm text-amber-600 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" />{pkg.rating.toFixed(1)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleToggleActive} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}>
            {pkg.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {pkg.isActive ? 'Active' : 'Inactive'}
          </button>
          <div className="relative group">
            <button className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${pkg.featuredRank ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
              <Star className={`w-4 h-4 ${pkg.featuredRank ? 'fill-current' : ''}`} />
              {pkg.featuredRank ? `Featured #${pkg.featuredRank}` : 'Not Featured'}
            </button>
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1 hidden group-hover:block">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Set Featured Rank</p>
              {[1, 2, 3, 4, 5, 6, 7].map((r) => (
                <button key={r} onClick={() => handleFeatureToggle(r)} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${pkg.featuredRank === r ? 'text-amber-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>Rank #{r}</button>
              ))}
              {pkg.featuredRank && (
                <button onClick={() => handleFeatureToggle(null)} className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700 mt-1 pt-2">Remove</button>
              )}
            </div>
          </div>
          {editMode ? (
            <>
              <button onClick={cancelEdit} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-70 flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={enterEditMode} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
              <Edit className="w-4 h-4" /> Edit Package
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{Number(pkg.price || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{pkg._count?.bookings || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rating</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-1">
            <Star className="w-5 h-5 text-amber-500 fill-current" />
            {pkg.rating?.toFixed(1) || '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>{pkg.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Tabs */}
      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Banner */}
          <div className="rounded-xl overflow-hidden">
            {pkg.bannerImage ? (
              <img src={getImageUrl(pkg.bannerImage)} alt={pkg.title} className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-white text-lg">No Image</div>
            )}
          </div>

          {editMode && draft ? (
            /* EDIT MODE */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input value={draft.title} onChange={(e) => updateDraftField('title', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
                  <input value={draft.destination} onChange={(e) => updateDraftField('destination', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (days)</label>
                  <input type="number" value={draft.durationDays} onChange={(e) => updateDraftField('durationDays', Number(e.target.value))} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                  <input type="number" value={draft.price} onChange={(e) => updateDraftField('price', Number(e.target.value))} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={draft.category} onChange={(e) => updateDraftField('category', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white">
                    <option value="group_tours">Group Tour</option>
                    <option value="weekend_trips">Weekend Trip</option>
                    <option value="family_tours">Family Tour</option>
                    <option value="pilgrimage">Pilgrimage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banner Image URL</label>
                  <input value={draft.bannerImage || ''} onChange={(e) => updateDraftField('bannerImage', e.target.value || null)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={4} value={draft.description} onChange={(e) => updateDraftField('description', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white" />
              </div>

              {/* Itinerary Editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Itinerary</h3>
                  <button onClick={() => addArrayRow('itineraries', { dayNumber: draft.itineraries.length + 1, title: '', description: '', morningActivity: '', afternoonActivity: '', eveningActivity: '', nightActivity: '', locations: [], activities: [] })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Day</button>
                </div>
                <div className="space-y-4">
                  {draft.itineraries.map((it, i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">Day {it.dayNumber}</span>
                        <button onClick={() => removeArrayRow('itineraries', i)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input value={it.title} onChange={(e) => updateArrayDraft('itineraries', i, 'title', e.target.value)} placeholder="Title" className="col-span-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                        <input value={it.morningActivity || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'morningActivity', e.target.value)} placeholder="Morning activity" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                        <input value={it.afternoonActivity || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'afternoonActivity', e.target.value)} placeholder="Afternoon activity" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                        <input value={it.eveningActivity || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'eveningActivity', e.target.value)} placeholder="Evening activity" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                        <input value={it.nightActivity || ''} onChange={(e) => updateArrayDraft('itineraries', i, 'nightActivity', e.target.value)} placeholder="Night activity" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing Options</h3>
                  <button onClick={() => addArrayRow('pricingOptions', { roomType: 'sharing', price: 0 })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {draft.pricingOptions.map((po, i) => (
                    <div key={i} className="flex gap-3">
                      <select value={po.roomType} onChange={(e) => updateArrayDraft('pricingOptions', i, 'roomType', e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white">
                        <option value="sharing">Sharing</option>
                        <option value="triple">Triple</option>
                        <option value="double">Double</option>
                        <option value="single">Single</option>
                      </select>
                      <input type="number" value={po.price} onChange={(e) => updateArrayDraft('pricingOptions', i, 'price', Number(e.target.value))} className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      <button onClick={() => removeArrayRow('pricingOptions', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departures Editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Departures</h3>
                  <button onClick={() => addArrayRow('departures', { departureDate: '', availableSeats: 20, price: Number(pkg.price) || 0, isActive: true })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {draft.departures.map((d, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input type="date" value={d.departureDate} onChange={(e) => updateArrayDraft('departures', i, 'departureDate', e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      <input type="number" value={d.availableSeats} onChange={(e) => updateArrayDraft('departures', i, 'availableSeats', Number(e.target.value))} placeholder="Seats" className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      <input type="number" value={d.price} onChange={(e) => updateArrayDraft('departures', i, 'price', Number(e.target.value))} placeholder="Price" className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      <button onClick={() => removeArrayRow('departures', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions/Exclusions Editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inclusions / Exclusions</h3>
                  <button onClick={() => addArrayRow('inclusions', { type: 'inclusion', description: '' })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {draft.inclusions.map((inc, i) => (
                    <div key={i} className="flex gap-3">
                      <select value={inc.type} onChange={(e) => updateArrayDraft('inclusions', i, 'type', e.target.value)} className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white">
                        <option value="inclusion">Inclusion</option>
                        <option value="exclusion">Exclusion</option>
                      </select>
                      <input value={inc.description} onChange={(e) => updateArrayDraft('inclusions', i, 'description', e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      <button onClick={() => removeArrayRow('inclusions', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-Ons Editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add-Ons</h3>
                  <button onClick={() => addArrayRow('addOns', { title: '', description: '', price: 0 })} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
                <div className="space-y-2">
                  {draft.addOns.map((ao, i) => (
                    <div key={i} className="flex gap-3">
                      <input value={ao.title} onChange={(e) => updateArrayDraft('addOns', i, 'title', e.target.value)} placeholder="Title" className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      <input value={ao.description || ''} onChange={(e) => updateArrayDraft('addOns', i, 'description', e.target.value)} placeholder="Description" className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      <input type="number" value={ao.price} onChange={(e) => updateArrayDraft('addOns', i, 'price', Number(e.target.value))} className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                      <button onClick={() => removeArrayRow('addOns', i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{pkg.description}</p>
              </div>

              {pkg.itineraries?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Itinerary</h3>
                  <div className="space-y-4">
                    {pkg.itineraries.map((it) => (
                      <div key={it.dayNumber} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Day {it.dayNumber}: {it.title}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          {it.morningActivity && <div><span className="font-medium">Morning:</span> {it.morningActivity}</div>}
                          {it.afternoonActivity && <div><span className="font-medium">Afternoon:</span> {it.afternoonActivity}</div>}
                          {it.eveningActivity && <div><span className="font-medium">Evening:</span> {it.eveningActivity}</div>}
                          {it.nightActivity && <div><span className="font-medium">Night:</span> {it.nightActivity}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pkg.pricingOptions?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pricing</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {pkg.pricingOptions.map((po) => (
                      <div key={po.roomType} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase">{po.roomType}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{Number(po.price).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pkg.departures?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Departures</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {pkg.departures.map((d, i) => (
                      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(d.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-gray-500">{d.availableSeats} seats · ₹{Number(d.price).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pkg.inclusions?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Inclusions & Exclusions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pkg.inclusions.map((inc, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {inc.type === 'inclusion' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">{inc.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pkg.addOns?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Add-Ons</h3>
                  <div className="space-y-2">
                    {pkg.addOns.map((ao, i) => (
                      <div key={i} className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{ao.title}</p>
                          {ao.description && <p className="text-xs text-gray-500">{ao.description}</p>}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{Number(ao.price).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {tabLoading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner size="sm" /></div>
          ) : tabData.history ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{tabData.history.analytics?.totalBookings || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{(tabData.history.analytics?.totalRevenue || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{tabData.history.analytics?.completionRate || 0}%</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Booking ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Agent</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {tabData.history.items?.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer" onClick={() => navigate(`/admin/bookings/${b.id}`)}>
                          <td className="px-4 py-3 text-sm font-mono text-gray-500">{b.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/customers/${b.customer.id}`); }} className="text-teal-600 hover:text-teal-700 font-medium">
                              {b.customer.name}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {b.assignedAgent ? (
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/agents/${b.assignedAgent.id}`); }} className="text-teal-600 hover:text-teal-700">
                                {b.assignedAgent.user.name}
                              </button>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(b.bookingDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">₹{Number(b.totalAmount).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>{b.status.replace(/_/g, ' ')}</span></td>
                        </tr>
                      ))}
                      {(!tabData.history.items || tabData.history.items.length === 0) && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No bookings yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : <p className="text-gray-500 text-sm">Failed to load history</p>}
        </div>
      )}

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div>
          {tabLoading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner size="sm" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tabData.agents?.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/agents/${item.agent.id}`)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-medium text-sm">
                      {item.agent.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.agent.name}</p>
                      <p className="text-xs text-gray-500">{item.agent.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-gray-500 text-xs">Rating</p><p className="font-medium text-gray-900 dark:text-white flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-current" />{item.agent.rating?.toFixed(1) || '—'}</p></div>
                    <div><p className="text-gray-500 text-xs">Completed</p><p className="font-medium text-gray-900 dark:text-white">{item.agent.completedTrips}</p></div>
                    <div><p className="text-gray-500 text-xs">Active</p><p className="font-medium text-gray-900 dark:text-white">{item.agent.activeTrips}</p></div>
                    <div><p className="text-gray-500 text-xs">Rejected</p><p className="font-medium text-red-500">{item.agent.rejectionCount}</p></div>
                  </div>
                </div>
              ))}
              {(!tabData.agents || tabData.agents.length === 0) && (
                <div className="col-span-full text-center py-8 text-gray-500 text-sm">No agents have opted in for this package</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {tabLoading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner size="sm" /></div>
          ) : tabData.reviews ? (
            <>
              {tabData.reviews.averageRating && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{tabData.reviews.averageRating.toFixed(1)}</p>
                    <div className="flex items-center justify-center"><Star className="w-4 h-4 text-amber-500 fill-current" /></div>
                    <p className="text-xs text-gray-500">{tabData.reviews.pagination?.total || 0} reviews</p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {tabData.reviews.items?.map((r) => (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-medium">
                          {r.customer.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <button onClick={() => navigate(`/admin/customers/${r.customer.id}`)} className="font-medium text-teal-600 hover:text-teal-700 text-sm">{r.customer.name}</button>
                          <p className="text-xs text-gray-500">{new Date(r.feedbackSubmittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < r.feedbackRating ? 'text-amber-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                    {r.feedbackComment && <p className="text-sm text-gray-600 dark:text-gray-400">{r.feedbackComment}</p>}
                    {r.assignedAgent && (
                      <p className="text-xs text-gray-500 mt-2">Agent: <button onClick={() => navigate(`/admin/agents/${r.assignedAgent.id}`)} className="text-teal-600 hover:text-teal-700">{r.assignedAgent.user.name}</button></p>
                    )}
                  </div>
                ))}
                {(!tabData.reviews.items || tabData.reviews.items.length === 0) && (
                  <div className="text-center py-8 text-gray-500 text-sm">No reviews yet</div>
                )}
              </div>
            </>
          ) : <p className="text-gray-500 text-sm">Failed to load reviews</p>}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { packagesAPI } from '../../services/api';
import { getImageUrl } from '../../services/packageService';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Pencil, Trash2, MapPin, Clock, Search, Filter, Users, Star, Image } from 'lucide-react';

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

// ─── Package card with image thumbnail ────────────────────────────────────────
function AgentPackageCard({ pkg, deletingId, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = pkg.bannerImage ? getImageUrl(pkg.bannerImage) : null;

  return (
    <Card variant="elevated" className="overflow-hidden bg-white border border-gray-200">
      {/* Image thumbnail */}
      <div className="relative h-40 overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={pkg.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center">
            <Image className="w-8 h-8 text-white/60" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant={pkg.isActive ? 'success' : 'warning'}>
            {pkg.isActive ? 'active' : 'inactive'}
          </Badge>
        </div>
      </div>

      {/* Card content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.title}</h3>

        <p className="text-sm text-gray-600 inline-flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4" /> {pkg.destination}
        </p>
        <p className="text-sm text-gray-600 inline-flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" /> {pkg.durationDays} days
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
          <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> flexible groups</span>
          <span className="inline-flex items-center gap-1"><Star className="w-3 h-3" /> top rated</span>
        </div>

        <p className="text-2xl font-bold text-gray-900 mb-4">{formatINR(pkg.price)}</p>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-500"
            style={{ width: `${Math.min(95, 30 + Number(pkg.durationDays || 0) * 8)}%` }}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" disabled={deletingId === pkg.id} onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> {deletingId === pkg.id ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function AgentPackages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await packagesAPI.list({ page: 1, limit: 100 });
      setItems(res.data?.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load packages.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const myPackages = useMemo(
    () => items.filter((pkg) => pkg.agent?.user?.id === user?.id),
    [items, user?.id]
  );

  const filteredPackages = useMemo(() => {
    return myPackages.filter((pkg) => {
      const status = pkg.isActive ? 'active' : 'inactive';
      const matchesSearch =
        pkg.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.destination?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myPackages, searchTerm, statusFilter]);

  const totals = useMemo(() => {
    const active = myPackages.filter((pkg) => pkg.isActive).length;
    const avgPrice =
      myPackages.length === 0
        ? 0
        : Math.round(myPackages.reduce((sum, pkg) => sum + Number(pkg.price || 0), 0) / myPackages.length);

    return {
      total: myPackages.length,
      active,
      inactive: myPackages.length - active,
      avgPrice,
    };
  }, [myPackages]);

  const onDelete = async (id) => {
    const ok = window.confirm('Delete this package?');
    if (!ok) return;

    try {
      setDeletingId(id);
      setError('');
      await packagesAPI.remove(id);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete package.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel Packages</h1>
          <p className="text-gray-600">Manage and optimize package listings from your agent workspace.</p>
        </div>
        <Link to="/agent/packages/new"><Button><Plus className="w-4 h-4 mr-2" /> New Package</Button></Link>
      </div>

      <Card variant="elevated" className="p-5 bg-white border border-gray-200">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by package title or destination"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" className="shrink-0"><Filter className="w-4 h-4 mr-1" /> Filters</Button>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-4 bg-white border border-gray-200"><p className="text-xs text-gray-500">Total Packages</p><p className="text-2xl font-bold text-gray-900">{totals.total}</p></Card>
        <Card variant="elevated" className="p-4 bg-white border border-gray-200"><p className="text-xs text-gray-500">Active</p><p className="text-2xl font-bold text-emerald-600">{totals.active}</p></Card>
        <Card variant="elevated" className="p-4 bg-white border border-gray-200"><p className="text-xs text-gray-500">Inactive</p><p className="text-2xl font-bold text-amber-600">{totals.inactive}</p></Card>
        <Card variant="elevated" className="p-4 bg-white border border-gray-200"><p className="text-xs text-gray-500">Avg. Price</p><p className="text-2xl font-bold text-gray-900">{formatINR(totals.avgPrice)}</p></Card>
      </section>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading packages...</p>
      ) : filteredPackages.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center bg-white border border-gray-200">
          <p className="text-gray-600 mb-4">No packages created yet.</p>
          <Link to="/agent/packages/new"><Button>Create Your First Package</Button></Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPackages.map((pkg) => (
            <AgentPackageCard
              key={pkg.id}
              pkg={pkg}
              deletingId={deletingId}
              onEdit={() => navigate(`/agent/packages/${pkg.id}/edit`)}
              onDelete={() => onDelete(pkg.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

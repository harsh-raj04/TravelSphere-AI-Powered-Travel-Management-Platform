import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { packagesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react';

export function AgentPackages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [deletingId, setDeletingId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await packagesAPI.list({ page: 1, limit: 100 });
      setItems(res.data?.data?.items || []);
    } catch {
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

  const onDelete = async (id) => {
    const ok = window.confirm('Delete this package?');
    if (!ok) return;

    try {
      setDeletingId(id);
      await packagesAPI.remove(id);
      await loadData();
    } catch {
      window.alert('Failed to delete package.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Manage Packages</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Create, update, and optimize your listed packages.</p>
        </div>
        <Link to="/agent/packages/new"><Button><Plus className="w-4 h-4 mr-2" /> New Package</Button></Link>
      </div>

      {loading ? (
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading packages...</p>
      ) : myPackages.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center">
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">No packages created yet.</p>
          <Link to="/agent/packages/new"><Button>Create Your First Package</Button></Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {myPackages.map((pkg) => (
            <Card key={pkg.id} variant="elevated" className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{pkg.title}</h3>
                <Badge variant="success">Active</Badge>
              </div>

              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary inline-flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" /> {pkg.destination}
              </p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary inline-flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" /> {pkg.durationDays} days
              </p>

              <p className="text-2xl font-bold text-brand-primary dark:text-brand-secondary mb-4">₹{Number(pkg.price || 0).toLocaleString()}</p>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/agent/packages/${pkg.id}/edit`)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" disabled={deletingId === pkg.id} onClick={() => onDelete(pkg.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> {deletingId === pkg.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

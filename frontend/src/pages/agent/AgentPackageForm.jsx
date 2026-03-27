import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { packagesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const defaultForm = {
  title: '',
  destination: '',
  duration_days: 3,
  price: 10000,
  description: '',
};

export function AgentPackageForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      try {
        const res = await packagesAPI.getById(id);
        const pkg = res.data?.data;

        if (pkg?.agent?.user?.id !== user?.id) {
          setError('You can edit only your own package.');
          return;
        }

        setForm({
          title: pkg.title || '',
          destination: pkg.destination || '',
          duration_days: Number(pkg.durationDays || 1),
          price: Number(pkg.price || 0),
          description: pkg.description || '',
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load package.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, user?.id]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length >= 2 &&
      form.destination.trim().length >= 2 &&
      Number(form.duration_days) > 0 &&
      Number(form.price) > 0 &&
      form.description.trim().length >= 10
    );
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        duration_days: Number(form.duration_days),
        price: Number(form.price),
      };

      if (isEdit) {
        await packagesAPI.update(id, payload);
      } else {
        await packagesAPI.create(payload);
      }

      navigate('/agent/packages');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save package.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary">
        {isEdit ? 'Edit Package' : 'Create Package'}
      </h1>

      <Card variant="premium" className="p-6">
        {loading ? (
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading form...</p>
        ) : (
          <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
            {error && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="sm:col-span-2">
              <Input
                label="Package Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Royal Rajasthan Escape"
              />
            </div>

            <Input
              label="Destination"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Rajasthan"
            />

            <Input
              label="Duration (days)"
              type="number"
              value={form.duration_days}
              onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
            />

            <Input
              label="Price (INR)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary min-h-[140px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe itinerary, highlights, and what is included..."
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/agent/packages')}>Cancel</Button>
              <Button type="submit" disabled={!canSubmit || saving}>{saving ? 'Saving...' : isEdit ? 'Update Package' : 'Create Package'}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

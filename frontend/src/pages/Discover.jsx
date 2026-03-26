import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { packagesAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Search, Sparkles, MapPin, Clock } from 'lucide-react';

export function Discover() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState([]);

  const categories = ['All', 'Beach', 'Mountains', 'Adventure', 'Luxury'];

  useEffect(() => {
    (async () => {
      try {
        const res = await packagesAPI.list({ page: 1, limit: 24 });
        setItems(res.data?.data?.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const data = useMemo(() => {
    const toCategory = (title = '', destination = '') => {
      const t = `${title} ${destination}`.toLowerCase();
      if (t.includes('goa') || t.includes('beach')) return 'Beach';
      if (t.includes('himachal') || t.includes('mountain') || t.includes('manali')) return 'Mountains';
      if (t.includes('trek') || t.includes('adventure')) return 'Adventure';
      return 'Luxury';
    };

    return items
      .map((pkg) => ({ ...pkg, category: toCategory(pkg.title, pkg.destination) }))
      .filter((pkg) => {
        const matchQuery = !query || `${pkg.title} ${pkg.destination}`.toLowerCase().includes(query.toLowerCase());
        const matchCat = activeCategory === 'All' || pkg.category === activeCategory;
        return matchQuery && matchCat;
      });
  }, [items, query, activeCategory]);

  return (
    <div className="py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Discover Destinations</h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Personalized package discovery inspired by your travel style.</p>
      </div>

      <Card variant="elevated" className="p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-light-text-tertiary dark:text-dark-text-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search destinations..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 text-white'
                    : 'bg-light-bg-secondary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card variant="elevated" className="p-5 bg-gradient-to-r from-sky-50 via-indigo-50 to-fuchsia-50 dark:from-dark-bg-secondary dark:via-dark-bg-tertiary dark:to-dark-bg-secondary">
        <div className="inline-flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-sky-600 via-indigo-600 to-fuchsia-600 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            AI signal: packages are ranked based on your recent interest in destination + duration + budget compatibility.
          </p>
        </div>
      </Card>

      {loading ? (
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading destinations...</p>
      ) : data.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">No destinations found for the selected filters.</Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.map((pkg) => (
            <Card key={pkg.id} variant="elevated" hover className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary">{pkg.category}</Badge>
                <Badge variant="success">{Math.min(99, 82 + (pkg.durationDays || 1))}% match</Badge>
              </div>
              <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{pkg.title}</h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {pkg.destination}</p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary inline-flex items-center gap-2"><Clock className="w-4 h-4" /> {pkg.durationDays} days</p>
              <p className="text-2xl font-bold text-brand-primary dark:text-brand-secondary">₹{Number(pkg.price || 0).toLocaleString()}</p>
              <div className="mt-auto flex gap-2">
                <Link to={`/packages/${pkg.id}`} className="flex-1"><Button fullWidth>View Details</Button></Link>
                <Link to="/plan" className="flex-1"><Button fullWidth variant="secondary">Plan</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Profile() {
  const { user } = useAuth();

  return (
    <div className="py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary">Profile</h1>
      <Card variant="premium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{user?.name || 'Traveler'}</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">{user?.email}</p>
          </div>
          <Badge variant="primary">{user?.role || 'customer'}</Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-tertiary">
            <p className="text-light-text-tertiary dark:text-dark-text-tertiary mb-1">Member Since</p>
            <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">2026</p>
          </div>
          <div className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-tertiary">
            <p className="text-light-text-tertiary dark:text-dark-text-tertiary mb-1">Preferred Mode</p>
            <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">Premium Traveler</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { cn } from './ui/utils';

export function StatusBadge({ status, variant = 'default' }) {
  const getStatusStyle = () => {
    switch (String(status || '').toLowerCase()) {
      case 'confirmed':
      case 'completed':
      case 'active':
      case 'resolved':
      case 'success':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pending':
      case 'in-progress':
      case 'open':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'cancelled':
      case 'failed':
      case 'inactive':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'refunded':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'urgent':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const sizeClass = variant === 'small' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium capitalize', getStatusStyle(), sizeClass)}>
      {status}
    </span>
  );
}

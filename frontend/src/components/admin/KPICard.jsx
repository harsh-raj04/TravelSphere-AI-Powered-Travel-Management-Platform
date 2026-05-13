import { cn } from './ui/utils';

export function KPICard({ title, value, icon: Icon, trend, iconColor = 'text-blue-500' }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-lg',
            iconColor === 'text-blue-500'    && 'bg-blue-500/10',
            iconColor === 'text-emerald-500' && 'bg-emerald-500/10',
            iconColor === 'text-purple-500'  && 'bg-purple-500/10',
            iconColor === 'text-amber-500'   && 'bg-amber-500/10',
            iconColor === 'text-teal-500'    && 'bg-teal-500/10',
            iconColor === 'text-red-500'     && 'bg-red-500/10',
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}

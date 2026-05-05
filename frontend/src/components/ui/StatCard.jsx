export function StatCard({ icon: Icon, label, value, variant = 'blue', trend = null }) {
  const variants = {
    blue: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
    green: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
    purple: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white',
    orange: 'bg-gradient-to-br from-orange-500 to-red-600 text-white',
  };

  return (
    <div className={`${variants[variant]} rounded-xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="w-5 h-5 opacity-80" />}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold">{value}</span>
        {trend && <span className="text-xs font-semibold">{trend}</span>}
      </div>
    </div>
  );
}

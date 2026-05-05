export function ColorfulCard({ children, variant = 'blue', className = '' }) {
  const variants = {
    blue: 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-md hover:shadow-lg hover:border-blue-300 transition-all',
    green: 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all',
    purple: 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-md hover:shadow-lg hover:border-purple-300 transition-all',
    orange: 'bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 shadow-md hover:shadow-lg hover:border-orange-300 transition-all',
    gradient: 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg',
    light: 'bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all',
  };

  return (
    <div className={`${variants[variant]} rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

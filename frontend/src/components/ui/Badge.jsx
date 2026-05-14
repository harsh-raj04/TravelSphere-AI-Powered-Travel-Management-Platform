export function Badge({ children, variant = 'primary', size = 'md', className = '' }) {
  const variants = {
    primary: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
    accent: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    purple: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs rounded-md',
    md: 'px-3 py-1.5 text-sm rounded-lg',
    lg: 'px-4 py-2 text-base rounded-lg',
  };

  return (
    <span className={`inline-block font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

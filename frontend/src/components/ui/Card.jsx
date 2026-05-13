export function Card({ children, variant = 'default', hover = false, className = '' }) {
  const variants = {
    default:  'bg-white dark:bg-dark-bg-secondary border border-teal-100/60 dark:border-dark-border shadow-sm',
    elevated: 'bg-white dark:bg-dark-bg-secondary shadow-md',
    premium:  'bg-white dark:bg-dark-bg-secondary shadow-lg border border-teal-100/40 dark:border-dark-border',
    glass:    'backdrop-blur-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10',
  };

  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer' : '';

  return (
    <div className={`${variants[variant]} rounded-2xl p-4 ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}

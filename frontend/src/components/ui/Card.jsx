export function Card({ children, variant = 'default', hover = false, className = '' }) {
  const variants = {
    default: 'bg-light-bg-tertiary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border shadow-sm',
    elevated: 'bg-light-bg-tertiary dark:bg-dark-bg-secondary shadow-md',
    premium: 'bg-light-bg-tertiary dark:bg-dark-bg-secondary shadow-lg',
    glass: 'backdrop-blur-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10',
  };

  const hoverClasses = hover ? 'hover:shadow-lg hover:scale-105 transition-all duration-300' : '';

  return (
    <div className={`${variants[variant]} rounded-xl p-4 ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}

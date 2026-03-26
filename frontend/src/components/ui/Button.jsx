export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-blue-700 focus:ring-brand-primary dark:hover:bg-blue-900',
    secondary: 'bg-light-bg-secondary text-light-text-primary border border-light-border hover:bg-light-border dark:bg-dark-bg-tertiary dark:text-dark-text-primary dark:border-dark-border dark:hover:bg-dark-border',
    outline: 'border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white dark:border-brand-secondary dark:text-brand-secondary dark:hover:bg-brand-secondary dark:hover:text-dark-bg-primary',
    ghost: 'text-brand-primary hover:bg-blue-50 dark:text-brand-secondary dark:hover:bg-dark-bg-tertiary',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

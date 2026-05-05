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
    primary: 'bg-[#0F766E] text-white hover:bg-[#0d635c] focus:ring-[#0F766E] dark:bg-[#14B8A6] dark:hover:bg-[#0d9488]',
    secondary: 'bg-[#F0FDFA] text-[#0F766E] border border-[#14B8A6] hover:bg-[#ccfbf1] dark:bg-[#022C22] dark:text-[#14B8A6] dark:border-[#0F766E] dark:hover:bg-[#0F766E]/20',
    outline: 'border-2 border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white dark:border-[#14B8A6] dark:text-[#14B8A6] dark:hover:bg-[#14B8A6] dark:hover:text-[#022C22]',
    ghost: 'text-[#0F766E] hover:bg-[#F0FDFA] dark:text-[#14B8A6] dark:hover:bg-[#022C22]',
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

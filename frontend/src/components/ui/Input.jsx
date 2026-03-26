export function Input({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  label = '',
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-bg-tertiary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary transition-all focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${error ? 'border-brand-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-brand-error mt-1">{error}</p>
      )}
    </div>
  );
}

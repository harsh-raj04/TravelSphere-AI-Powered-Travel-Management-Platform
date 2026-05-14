export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-14 w-14' };
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600 ${sizes[size]} ${className}`} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  );
}

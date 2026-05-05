import { X } from 'lucide-react';

export function Modal({ isOpen, title, children, onClose, size = 'md', actions = null }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        {actions && (
          <div className="sticky bottom-0 flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

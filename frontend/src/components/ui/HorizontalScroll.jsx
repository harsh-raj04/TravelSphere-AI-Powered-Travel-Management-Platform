import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function HorizontalScroll({ children, className = '' }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = 400;
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none' }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {children}
      </div>

      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-white dark:bg-slate-900 shadow-lg rounded-full p-2 hover:bg-brand-primary hover:text-white"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-white dark:bg-slate-900 shadow-lg rounded-full p-2 hover:bg-brand-primary hover:text-white"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}

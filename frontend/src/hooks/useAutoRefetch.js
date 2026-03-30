import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-refetching data with configurable intervals
 * Automatically refetches data every N milliseconds
 * Also refetches when tab regains focus
 */
export function useAutoRefetch(fetchFn, interval = 5000) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!fetchFn) return;

    // Setup interval
    intervalRef.current = setInterval(() => {
      console.debug('useAutoRefetch: Running interval refetch');
      fetchFn();
    }, interval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFn, interval]);

  // Refetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && fetchFn) {
        console.debug('useAutoRefetch: Tab became visible, refetching');
        fetchFn();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchFn]);
}


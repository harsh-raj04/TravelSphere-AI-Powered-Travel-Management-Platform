import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-refetching data with configurable intervals
 * Automatically refetches data every N milliseconds
 * Also refetches when tab regains focus
 */
export function useAutoRefetch(fetchFn, interval = 5000) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!fetchFn) {
      console.warn('useAutoRefetch: fetchFn is not provided');
      return;
    }

    // Setup interval
    intervalRef.current = setInterval(() => {
      try {
        console.debug('[useAutoRefetch] Interval refetch trigger');
        fetchFn();
      } catch (err) {
        console.error('[useAutoRefetch] Error in fetch:', err);
      }
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
        try {
          console.debug('[useAutoRefetch] Tab became visible, refetching');
          fetchFn();
        } catch (err) {
          console.error('[useAutoRefetch] Error on visibility change:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchFn]);
}


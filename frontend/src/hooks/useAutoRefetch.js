import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for auto-refetching data with configurable intervals
 * Refetches when tab regains focus or on regular intervals
 */
export function useAutoRefetch(fetchFn, dependencies = [], interval = 5000) {
  const [isRefetching, setIsRefetching] = useState(false);
  const intervalRef = useRef(null);
  const hasInitialized = useRef(false);

  // Set up refetch on visibility change (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsRefetching(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Set up interval refetch
  useEffect(() => {
    // Skip initial setup
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    intervalRef.current = setInterval(() => {
      setIsRefetching(true);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval]);

  // Execute refetch when triggered
  useEffect(() => {
    if (isRefetching) {
      fetchFn();
      setIsRefetching(false);
    }
  }, [isRefetching, fetchFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Allow manual trigger via returned function
  const refetch = () => setIsRefetching(true);
  return refetch;
}

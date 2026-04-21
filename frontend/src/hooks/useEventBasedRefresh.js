import { useContext, useEffect, useState } from 'react';
import { BookingEventContext } from '../contexts/BookingEventContext';

export function useEventBasedRefresh(fetchFn, eventName = 'booking:created') {
  const { on } = useContext(BookingEventContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch immediately on mount
    const performFetch = async () => {
      console.log(`[useEventBasedRefresh] Initial fetch for ${eventName}`);
      setLoading(true);
      try {
        await fetchFn();
      } catch (err) {
        console.error(`[useEventBasedRefresh] Error during fetch:`, err.message);
      } finally {
        setLoading(false);
      }
    };

    performFetch();

    // Listen for booking events and refetch
    const unsubscribe = on(eventName, () => {
      console.log(`[useEventBasedRefresh] Event triggered: ${eventName}, refetching...`);
      performFetch();
    });

    return unsubscribe;
  }, [fetchFn, eventName, on]);

  return loading;
}

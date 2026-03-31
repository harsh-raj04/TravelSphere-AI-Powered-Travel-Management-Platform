import React, { createContext, useCallback, useRef } from 'react';

/**
 * BookingEventContext - Event emitter for booking and payment-related events
 * 
 * Available Events:
 * - booking:created: Emitted when a new booking is created
 * - booking:cancelled: Emitted when a booking is cancelled
 * - booking:confirmed: Emitted when a booking is confirmed
 * - booking:completed: Emitted when a booking is completed
 * - payment:completed: Emitted when a payment is completed successfully
 * 
 * Usage:
 *   const { emit, on } = useContext(BookingEventContext);
 *   
 *   // Listen to events
 *   useEffect(() => {
 *     const unsubscribe = on('booking:created', (data) => {
 *       console.log('Booking created:', data);
 *       refetchData();
 *     });
 *     return unsubscribe;
 *   }, [on]);
 *   
 *   // Emit events
 *   emit('booking:created', { bookingId: '123', packageId: 'pkg-1' });
 */
export const BookingEventContext = createContext();

export function BookingEventProvider({ children }) {
  const listenersRef = useRef({});

  const on = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(callback);

    // Return unsubscribe function
    return () => {
      listenersRef.current[event] = listenersRef.current[event].filter((cb) => cb !== callback);
    };
  }, []);

  const emit = useCallback((event, data) => {
    console.log(`[BookingEvent] Emitting: ${event}`, data);
    if (listenersRef.current[event]) {
      listenersRef.current[event].forEach((callback) => callback(data));
    }
  }, []);

  const value = { on, emit };

  return (
    <BookingEventContext.Provider value={value}>
      {children}
    </BookingEventContext.Provider>
  );
}

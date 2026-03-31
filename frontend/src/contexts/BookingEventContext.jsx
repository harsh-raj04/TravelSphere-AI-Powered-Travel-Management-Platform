import React, { createContext, useCallback, useRef } from 'react';

// Event emitter for booking-related events
export const BookingEventContext = createContext();

export function BookingEventProvider({ children }) {
  const listenersRef = useRef({});

  const on = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(callback);

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

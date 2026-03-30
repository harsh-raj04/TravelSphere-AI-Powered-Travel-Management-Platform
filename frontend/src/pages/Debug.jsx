import { useEffect, useState } from 'react';
import { bookingsAPI } from '../services/api';

export function Debug() {
  const [status, setStatus] = useState('Loading...');
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const test = async () => {
      try {
        console.log('Fetching bookings...');
        const res = await bookingsAPI.myBookings();
        console.log('Response:', res);
        
        const items = res.data?.data?.items || [];
        setBookings(items);
        setStatus(`✅ SUCCESS: Found ${items.length} bookings`);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        setStatus('❌ FAILED');
      }
    };

    test();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug: Bookings API</h1>
      
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded font-mono text-sm">
        <div className="mb-2">
          <strong>Status:</strong> {status}
        </div>
        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Bookings ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-600">No bookings found</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
                <h3 className="font-bold">{b.package?.title || 'N/A'}</h3>
                <p className="text-sm">ID: {b.id}</p>
                <p className="text-sm">Status: {b.status}</p>
                <p className="text-sm">Amount: ₹{b.totalAmount}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

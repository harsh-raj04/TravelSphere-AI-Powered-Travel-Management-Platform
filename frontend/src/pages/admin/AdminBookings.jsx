import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '../../services/api';

const PAGE_SIZE = 12;

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

function statusTone(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'confirmed' || value === 'success') return 'bg-emerald-100 text-emerald-700';
  if (value === 'pending' || value === 'initiated') return 'bg-amber-100 text-amber-700';
  if (value === 'cancelled' || value === 'failed') return 'bg-rose-100 text-rose-700';
  return 'bg-gray-100 text-gray-700';
}

export function AdminBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminAPI.bookings({ page, limit: PAGE_SIZE });
        const data = res.data?.data;
        setBookings(data?.items || []);
        setTotal(data?.pagination?.total || 0);
      } catch {
        setBookings([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
        <p className="text-gray-600">Track customer bookings, package ownership, and transaction health.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Booked By</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Package</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Agent</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Booking Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Booking Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                    Loading bookings...
                  </td>
                </tr>
              )}

              {!loading &&
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{booking.customer?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{booking.customer?.email || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{booking.package?.title || '-'}</p>
                      <p className="text-xs text-gray-500">{booking.package?.destination || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{booking.package?.agent?.user?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatINR(booking.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${statusTone(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${statusTone(
                          booking.transaction?.status
                        )}`}
                      >
                        {booking.transaction?.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

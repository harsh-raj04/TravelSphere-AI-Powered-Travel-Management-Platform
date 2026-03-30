import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');

  const params = useMemo(() => {
    const next = { page, limit: PAGE_SIZE };

    if (search.trim()) {
      next.search = search.trim();
    }

    if (bookingStatus) {
      next.booking_status = bookingStatus;
    }

    if (transactionStatus) {
      next.transaction_status = transactionStatus;
    }

    return next;
  }, [page, search, bookingStatus, transactionStatus]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminAPI.bookings(params);
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
  }, [params]);

  const onChangeFilter = (setter) => (event) => {
    setPage(1);
    setter(event.target.value);
  };

  const handleExport = () => {
    if (bookings.length === 0) return;

    const rows = [
      [
        'Booking ID',
        'Booked By',
        'Customer Email',
        'Package',
        'Destination',
        'Agent',
        'Booking Date',
        'Amount',
        'Booking Status',
        'Transaction Status',
      ],
      ...bookings.map((booking) => [
        booking.id,
        booking.customer?.name || '',
        booking.customer?.email || '',
        booking.package?.title || '',
        booking.package?.destination || '',
        booking.package?.agent?.user?.name || '',
        booking.bookingDate ? new Date(booking.bookingDate).toISOString() : '',
        Number(booking.totalAmount || 0),
        booking.status || '',
        booking.transaction?.status || '',
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-bookings-page-${page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
        <p className="text-gray-600">Track customer bookings, package ownership, and transaction health.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="md:col-span-2 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={onChangeFilter(setSearch)}
              placeholder="Search customer, package, destination, or agent"
              className="w-full bg-transparent outline-none text-sm text-gray-700"
            />
          </label>

          <select
            value={bookingStatus}
            onChange={onChangeFilter(setBookingStatus)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
          >
            <option value="">All booking statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={transactionStatus}
            onChange={onChangeFilter(setTransactionStatus)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
          >
            <option value="">All transaction statuses</option>
            <option value="initiated">Initiated</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing results with current filters and pagination.</p>
          <button
            type="button"
            onClick={handleExport}
            disabled={bookings.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
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

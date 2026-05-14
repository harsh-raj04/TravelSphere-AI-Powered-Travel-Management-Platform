import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, MapPin, IndianRupee, ArrowLeft, Star } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { PageSpinner } from '../../components/ui/LoadingSpinner';

export function AdminCustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getUser(id);
        setUser(res.data?.data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <PageSpinner />;
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">User not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-teal-600 font-medium">Go back</button>
      </div>
    );
  }

  const statusBadge = (status) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-700', pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700', in_progress: 'bg-teal-100 text-teal-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Customer Profile</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-xl font-semibold">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {user.phone}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Total Bookings</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{user._count?.bookings || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Joined</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Booking History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Package</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {user.bookings?.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer" onClick={() => navigate(`/admin/bookings/${b.id}`)}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{b.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-teal-600 font-medium">{b.travelPackage?.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(b.bookingDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">₹{Number(b.totalAmount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>{b.status.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
              {(!user.bookings || user.bookings.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

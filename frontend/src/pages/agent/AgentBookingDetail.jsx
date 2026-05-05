import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ColorfulCard } from '../../components/ui/ColorfulCard';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { agentAPI } from '../../services/api';
import { ArrowLeft, Calendar, Users, DollarSign } from 'lucide-react';

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function AgentBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [booking, setBooking] = useState(state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) return;

    (async () => {
      setLoading(true);
      try {
        const res = await agentAPI.bookings();
        const items = res.data?.data?.items || [];
        const found = items.find((b) => b.id === id);
        if (found) setBooking(found);
        else setError('Booking not found');
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
    </div>
  );

  if (!booking) return (
    <div className="p-8">
      <Button onClick={() => navigate(-1)} variant="outline" className="mb-4"> <ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">{error || 'Booking not found'}</div>
    </div>
  );

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600">Order ID: {booking.id.slice(0,8).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate(-1)} variant="ghost">Back</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={Users} label="Travelers" value={booking.travelersCount} variant="blue" />
        <StatCard icon={DollarSign} label="Total Amount" value={formatINR(booking.totalAmount)} variant="green" />
        <StatCard icon={Calendar} label="Travel Date" value={new Date(booking.travelDate).toLocaleDateString()} variant="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <ColorfulCard variant="blue">
            <h3 className="text-lg font-bold mb-3">Customer Details</h3>
            <p className="text-sm">Name: <strong>{booking.customer?.name || booking.customerName}</strong></p>
            <p className="text-sm">Email: <strong>{booking.customer?.contactEmail || booking.contactEmail || 'Hidden'}</strong></p>
            <p className="text-sm">Phone: <strong>{booking.customer?.contactPhone || booking.contactPhone || 'Hidden'}</strong></p>
          </ColorfulCard>

          <ColorfulCard variant="green">
            <h3 className="text-lg font-bold mb-3">Travel Details</h3>
            <p className="text-sm">Package: <strong>{booking.package?.title}</strong></p>
            <p className="text-sm">Destination: <strong>{booking.package?.destination}</strong></p>
            <p className="text-sm">Duration: <strong>{booking.package?.durationDays} days</strong></p>
            <div className="mt-3">
              <h4 className="font-semibold">Itinerary</h4>
              {(booking.package?.itinerary || []).length === 0 ? (
                <p className="text-sm text-gray-600">No itinerary available.</p>
              ) : (
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  {booking.package.itinerary.map((row, idx) => (
                    <li key={idx}>{row}</li>
                  ))}
                </ol>
              )}
            </div>
          </ColorfulCard>
        </div>

        <div className="space-y-6">
          <ColorfulCard variant="purple">
            <h3 className="text-lg font-bold mb-3">Payment / Settlement</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span>Your payout</span><strong>{formatINR(booking.agentPayout || (booking.totalAmount * 0.7))}</strong></div>
              <div className="flex justify-between"><span>Paid by admin</span><strong>{formatINR(booking.payoutPaidAmount || 0)}</strong></div>
              <div className="flex justify-between"><span>Remaining</span><strong>{formatINR(Math.max(Number(booking.agentPayout || 0) - Number(booking.payoutPaidAmount || 0), 0))}</strong></div>
              <div className="flex justify-between"><span>Payout status</span><strong>{String(booking.payoutStatus || 'unpaid').toUpperCase()}</strong></div>
              <div className="flex justify-between"><span>Settlement ref</span><strong>{booking.payoutTransactionReference || 'Not set'}</strong></div>
              <div className="flex justify-between"><span>Paid at</span><strong>{booking.payoutPaidAt ? new Date(booking.payoutPaidAt).toLocaleString() : 'Not paid yet'}</strong></div>
            </div>
          </ColorfulCard>

          <ColorfulCard variant="light">
            <h3 className="text-lg font-bold mb-3">Customer Payment</h3>
            {booking.transaction ? (
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span>Amount</span><strong>{formatINR(booking.transaction.amount)}</strong></div>
                <div className="flex justify-between"><span>Status</span><strong>{String(booking.transaction.status).toUpperCase()}</strong></div>
                <div className="flex justify-between"><span>Method</span><strong>{booking.transaction.paymentMethod}</strong></div>
                <div className="flex justify-between"><span>Reference</span><strong>{booking.transaction.transactionReference}</strong></div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No customer payment recorded yet.</p>
            )}
          </ColorfulCard>
        </div>
      </div>
    </div>
  );
}

export default AgentBookingDetail;

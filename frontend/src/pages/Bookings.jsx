import { useEffect, useState } from 'react';
import { bookingsAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { X } from 'lucide-react';

export function Bookings() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  const loadBookings = async () => {
    try {
      const res = await bookingsAPI.myBookings();
      setItems(res.data?.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const submitFeedback = async () => {
    if (!feedbackBooking) return;

    setFeedbackSaving(true);
    try {
      await bookingsAPI.submitFeedback(feedbackBooking.id, feedbackForm);
      setFeedbackBooking(null);
      setFeedbackForm({ rating: 5, comment: '' });
      setLoading(true);
      await loadBookings();
    } finally {
      setFeedbackSaving(false);
    }
  };

  return (
    <div className="travel-ui py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">Bookings</h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Manage your package bookings and track confirmation status.</p>
      </div>

      {
        loading ? (
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading bookings...</p>
        ) : items.length === 0 ? (
          <Card variant="elevated" className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
            No bookings found.
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} variant="elevated" className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">
                      {item.package?.title || 'Travel Package'}
                    </h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {item.package?.destination || 'Destination'} • {new Date(item.travelDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={['confirmed', 'assigned', 'accepted', 'in_progress', 'completed', 'closed'].includes(item.status) ? 'success' : 'warning'}>{item.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Travelers: {item.travelersCount}
                </p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Contact: {item.contactEmail} {item.contactPhone ? `• ${item.contactPhone}` : ''}
                </p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Assigned Agent: {item.assignedAgent?.user?.name || 'Not assigned yet'}
                </p>
                <p className="text-xl font-bold text-brand-primary dark:text-brand-secondary mt-1">
                  ₹{Number(item.totalAmount || 0).toLocaleString()}
                </p>

                {['completed', 'closed'].includes(String(item.status)) && !item.feedbackSubmittedAt && (
                  <div className="mt-3">
                    <Button size="sm" variant="secondary" onClick={() => setFeedbackBooking(item)}>
                      Give Feedback
                    </Button>
                  </div>
                )}

                {item.feedbackSubmittedAt && (
                  <p className="text-xs text-emerald-600 mt-3">Feedback submitted: {item.feedbackRating}/5</p>
                )}
              </Card>
            ))}
          </div>
        )
      }

      {feedbackBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Share Trip Feedback</h3>
              <button onClick={() => setFeedbackBooking(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <select
                value={feedbackForm.rating}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                ))}
              </select>

              <textarea
                rows={4}
                value={feedbackForm.comment}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, comment: event.target.value }))}
                placeholder="How was your trip experience?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setFeedbackBooking(null)}>Cancel</Button>
                <Button onClick={submitFeedback} disabled={feedbackSaving || feedbackForm.comment.trim().length < 3}>
                  {feedbackSaving ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { CheckCircle, X, ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { Button } from './Button';

export function BookingSuccessModal({ isOpen, onClose, booking, packageTitle, userName, onViewBookings }) {
  if (!isOpen) return null;

  const firstName = userName?.split(' ')[0] || 'Traveler';

  const destinationMessages = {
    'Goa': `${firstName}, the golden beaches of Goa are waiting for you!`,
    'Manali': `${firstName}, the snow-capped peaks of Manali are calling your name!`,
    'Shimla': `${firstName}, the charming hills of Shimla are ready to welcome you!`,
    'Kashmir': `${firstName}, paradise on Earth — Kashmir awaits your arrival!`,
    'Kedarnath': `${firstName}, a divine journey to Kedarnath is about to begin!`,
    'Rajasthan': `${firstName}, the majestic forts of Rajasthan await your footsteps!`,
    'Kerala': `${firstName}, the serene backwaters of Kerala are calling you!`,
    'Andaman': `${firstName}, turquoise waters of Andaman are ready for your arrival!`,
    'Ladakh': `${firstName}, the breathtaking landscapes of Ladakh await!`,
    'Rishikesh': `${firstName}, the spiritual vibes of Rishikesh are calling your soul!`,
  };

  const findDestination = () => {
    for (const [key, msg] of Object.entries(destinationMessages)) {
      if (packageTitle?.includes(key)) return msg;
    }
    return `${firstName}, an amazing journey awaits you!`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Green gradient header */}
        <div className="bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#22D3EE] px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Booking Confirmed!</h2>
          <p className="text-white/80 text-sm">{findDestination()}</p>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-1">Booking ID</p>
            <p className="text-lg font-bold text-teal-600 dark:text-teal-400 tracking-wider">{booking?.id?.slice(-8)?.toUpperCase()}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-teal-500" />
              <span className="text-sm">{packageTitle}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-teal-500" />
              <span className="text-sm">{booking?.travelDate ? new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Users className="w-4 h-4 text-teal-500" />
              <span className="text-sm">{booking?.travelers} {booking?.travelers === 1 ? 'traveler' : 'travelers'}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30"
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={onViewBookings}
              className="flex-1 rounded-xl bg-[#0F766E] hover:bg-[#064E48] flex items-center justify-center gap-2"
            >
              My Bookings
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

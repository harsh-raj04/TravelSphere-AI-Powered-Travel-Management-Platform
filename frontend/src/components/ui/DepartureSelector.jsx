import { Calendar, Users } from 'lucide-react';

export function DepartureSelector({ departures, onSelect, selectedDate }) {
  if (!departures || departures.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
        <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400">No departures available at this time.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-teal-600" />
        Available Dates
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {departures.map((dep) => {
          const isSelected = selectedDate && (selectedDate.id === dep.id || selectedDate.departureDate === dep.departureDate);
          const seatsLeft = dep.availableSeats - (dep.bookedSeats || 0);
          const isSoldOut = seatsLeft <= 0;

          return (
            <button
              key={dep.id}
              onClick={() => !isSoldOut && onSelect && onSelect(dep)}
              disabled={isSoldOut}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30 shadow-md shadow-teal-100 dark:shadow-teal-900/20'
                  : isSoldOut
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 opacity-50 cursor-not-allowed'
                  : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 bg-white dark:bg-slate-800/30 cursor-pointer'
              }`}
            >
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {new Date(dep.departureDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className={`text-xs font-medium ${isSoldOut ? 'text-red-500' : 'text-teal-600'}`}>
                  {isSoldOut ? 'Sold Out' : `${seatsLeft} seats left`}
                </span>
              </div>
              {dep.price && (
                <p className="text-sm font-bold text-teal-600 mt-1">
                  ₹{Number(dep.price).toLocaleString()}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

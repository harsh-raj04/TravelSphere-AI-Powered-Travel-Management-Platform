import { MapPin, Activity, Sunrise, Sun, Sunset, Moon } from 'lucide-react';

const TimeSlot = ({ icon: Icon, label, text, color }) => {
  if (!text) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`p-1.5 rounded-lg ${color} flex-shrink-0 mt-0.5`}>
        <Icon size={14} className="text-white" />
      </div>
      <div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{text}</p>
      </div>
    </div>
  );
};

export function ItineraryTimeline({ itineraries }) {
  if (!itineraries || itineraries.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
        <p className="text-slate-500 dark:text-slate-400">No itinerary available for this package.</p>
      </div>
    );
  }

  const hasTimeSlots = itineraries.some(
    (day) => day.morningActivity || day.afternoonActivity || day.eveningActivity || day.nightActivity
  );

  return (
    <div className="space-y-6">
      {itineraries.map((day, index) => (
        <div key={day.id || index} className="relative">
          {index !== itineraries.length - 1 && (
            <div className="absolute left-8 top-20 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-transparent rounded-full" />
          )}

          <div className="flex gap-5">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-bold text-lg shadow-lg shadow-teal-200 dark:shadow-teal-900/50">
                Day {day.dayNumber}
              </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{day.title}</h3>

              {hasTimeSlots ? (
                <div className="space-y-0.5 mb-4">
                  <TimeSlot icon={Sunrise} label="Morning" text={day.morningActivity} color="bg-amber-500" />
                  <TimeSlot icon={Sun} label="Afternoon" text={day.afternoonActivity} color="bg-orange-500" />
                  <TimeSlot icon={Sunset} label="Evening" text={day.eveningActivity} color="bg-rose-500" />
                  <TimeSlot icon={Moon} label="Night" text={day.nightActivity} color="bg-indigo-500" />
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 mb-4">{day.description}</p>
              )}

              {day.locations && day.locations.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Locations</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-6">
                    {day.locations.map((loc, idx) => (
                      <span key={idx} className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {day.activities && day.activities.length > 0 && (
                <div>
                  <div className="flex items-start gap-2 mb-2">
                    <Activity size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Activities</p>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {day.activities.map((act, idx) => (
                      <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">•</span>
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

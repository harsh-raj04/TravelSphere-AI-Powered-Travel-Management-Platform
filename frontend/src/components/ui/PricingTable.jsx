export function PricingTable({ pricingOptions, onSelect, selectedRoom }) {
  if (!pricingOptions || pricingOptions.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
        <p className="text-slate-500 dark:text-slate-400">No pricing options available.</p>
      </div>
    );
  }

  const roomLabels = {
    sharing: { icon: '👥', label: 'Sharing' },
    triple: { icon: '👨‍👩‍👧', label: 'Triple Sharing' },
    double: { icon: '🛏️', label: 'Double Occupancy' },
    single: { icon: '🚶', label: 'Single Occupancy' },
    infant: { icon: '👶', label: 'Infant (0-2 yrs)' },
  };

  const getRoomLabel = (roomType) => {
    const config = roomLabels[roomType];
    return config ? `${config.icon} ${config.label}` : roomType;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-teal-600 to-emerald-600">
            <th className="px-6 py-4 text-left font-semibold text-white">Room Type</th>
            <th className="px-6 py-4 text-right font-semibold text-white">Price Per Person</th>
            <th className="px-6 py-4 text-right font-semibold text-white">GST</th>
            <th className="px-6 py-4 text-right font-semibold text-white">Total (incl. GST)</th>
          </tr>
        </thead>
        <tbody>
          {pricingOptions.map((option, idx) => {
            const gst = Math.round(option.price * 0.05);
            const total = option.price + gst;
            const isSelected = selectedRoom && (selectedRoom.id === option.id || selectedRoom.roomType === option.roomType);

            return (
              <tr
                key={option.id || idx}
                onClick={() => onSelect && onSelect(option)}
                className={`border-b border-slate-200 dark:border-slate-700 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                } ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900/20' : 'bg-slate-50 dark:bg-slate-800/10'}`}
              >
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  {getRoomLabel(option.roomType)}
                  {isSelected && (
                    <span className="ml-2 text-xs text-teal-600 font-bold">SELECTED</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                  ₹{parseInt(option.price).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right text-sm text-slate-500 dark:text-slate-400">
                  ₹{gst.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-bold text-teal-600 text-lg">
                  ₹{total.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-right">
        * GST calculated at 5%. Prices may vary based on availability.
      </p>
    </div>
  );
}

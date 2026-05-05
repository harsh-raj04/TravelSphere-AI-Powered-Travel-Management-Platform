export function TabNavigation({ tabs, activeTab, onChange, onTabChange }) {
  const handleTabChange = onChange || onTabChange;
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-300 border-b-2 ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-teal-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

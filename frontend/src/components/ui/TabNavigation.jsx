import { useState } from 'react';

export function TabNavigation({ tabs = [], activeTab, onChange }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
            ${activeTab === tab.id
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

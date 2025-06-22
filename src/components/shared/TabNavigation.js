// src/components/shared/TabNavigation.js
import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'lineup', label: 'Generate Lineup', icon: '⚡' },
    { id: 'view', label: 'View Lineups', icon: '👁️' },
    { id: 'manage', label: 'Manage Players', icon: '👥' }
  ];

  return (
    <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center space-x-2 ${
            activeTab === tab.id 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
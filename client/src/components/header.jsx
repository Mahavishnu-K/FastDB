// components/Header.jsx
import React from 'react';
import { Database, Menu } from 'lucide-react';

const Header = ({ activeTab, setActiveTab, onSidebarToggle }) => {
  const tabs = ['Designer', 'Query', 'Schema', 'API'];

  return (
    <header className="bg-gray-950 border-b border-gray-600 px-6 py-2 relative z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onSidebarToggle}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle Schema Explorer"
          >
            <Menu className="w-6 h-6 text-gray-400" />
          </button>
          <Database className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-l font-bold text-white">FastDB</h1>
            <p className="text-xs text-gray-400">Natural Language to SQL</p>
          </div>
        </div>
        
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'border border-gray-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
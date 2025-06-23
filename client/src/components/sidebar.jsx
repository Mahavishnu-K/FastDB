import React from 'react';
import { Database, Table, ChevronRight, ChevronDown, X, Search } from 'lucide-react';

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  databases, 
  selectedDb, 
  onDbChange,
  tables,
  onTableSelect
}) => {
  
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <div className={`
        fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Schema Explorer</span>
          </div>
          <button onClick={onToggle} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Database Selector */}
        <div className="p-4 border-b border-gray-700">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Database</label>
            <select
              value={selectedDb}
              onChange={(e) => onDbChange(e.target.value)}
              className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              {databases.map(db => <option key={db} value={db}>{db}</option>)}
            </select>
        </div>

        {/* Schema Tree */}
        <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center space-x-2 p-2 mb-1">
              <Table className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Tables</span>
              <span className="text-xs text-gray-500">({tables.length})</span>
            </div>

            <div className="ml-4 space-y-1">
              {tables.map((table) => (
                <div key={table.id}>
                  <div 
                    className="flex items-center space-x-2 p-2 rounded cursor-pointer group hover:bg-gray-700 text-gray-300"
                    onClick={() => onTableSelect(table)}
                  >
                    <Table className="w-4 h-4 text-orange-400" />
                    <span className="text-sm flex-1">{table.name}</span>
                    <span className="text-xs opacity-75">({table.rowCount})</span>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Connected to: {selectedDb}
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
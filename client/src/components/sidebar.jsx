// components/Sidebar.jsx
import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Columns, 
  Key, 
  Hash, 
  ChevronRight, 
  ChevronDown, 
  X,
  Search,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';

const Sidebar = ({ tables, isOpen, onToggle, onTableSelect, selectedTable }) => {
  const [expandedNodes, setExpandedNodes] = useState({
    databases: true,
    tables: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState({});

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const toggleTable = (tableId) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColumnIcon = (column) => {
    if (column.primaryKey) return <Key className="w-3 h-3 text-yellow-400" />;
    if (column.type.toLowerCase().includes('int')) return <Hash className="w-3 h-3 text-blue-400" />;
    return <Columns className="w-3 h-3 text-gray-400" />;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Schema Explorer</span>
          </div>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Schema Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Databases Node */}
          <div className="mb-2">
            <div 
              className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => toggleNode('databases')}
            >
              {expandedNodes.databases ? 
                <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                <ChevronRight className="w-4 h-4 text-gray-400" />
              }
              <Database className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">Databases</span>
            </div>

            {expandedNodes.databases && (
              <div className="ml-4">
                {/* Default Database */}
                <div className="mb-2">
                  <div 
                    className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
                    onClick={() => toggleNode('tables')}
                  >
                    {expandedNodes.tables ? 
                      <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    }
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white">fastdb</span>
                    <span className="text-xs text-gray-500">({tables.length})</span>
                  </div>

                  {expandedNodes.tables && (
                    <div className="ml-4">
                      {/* Tables Node */}
                      <div className="flex items-center space-x-2 p-2 mb-1">
                        <Table className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-gray-300">Tables</span>
                        <button className="ml-auto p-1 hover:bg-gray-600 rounded">
                          <Plus className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>

                      {/* Table List */}
                      <div className="ml-4 space-y-1">
                        {filteredTables.map((table) => (
                          <div key={table.id}>
                            {/* Table Name */}
                            <div 
                              className={`flex items-center space-x-2 p-2 rounded cursor-pointer group ${
                                selectedTable?.id === table.id 
                                  ? 'bg-blue-600 text-white' 
                                  : 'hover:bg-gray-700 text-gray-300'
                              }`}
                              onClick={() => {
                                onTableSelect(table);
                                toggleTable(table.id);
                              }}
                            >
                              {expandedTables[table.id] ? 
                                <ChevronDown className="w-3 h-3" /> : 
                                <ChevronRight className="w-3 h-3" />
                              }
                              <Table className="w-4 h-4 text-orange-400" />
                              <span className="text-sm flex-1">{table.name}</span>
                              <span className="text-xs opacity-75">({table.data.length})</span>
                              <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                <button className="p-1 hover:bg-gray-600 rounded">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button className="p-1 hover:bg-red-600 rounded">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Table Columns */}
                            {expandedTables[table.id] && (
                              <div className="ml-6 space-y-1">
                                <div className="flex items-center space-x-2 p-1">
                                  <Columns className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">Columns</span>
                                </div>
                                {table.columns.map((column, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-center space-x-2 p-1 pl-4 hover:bg-gray-700 rounded cursor-pointer"
                                  >
                                    {getColumnIcon(column)}
                                    <span className="text-xs text-gray-300">{column.name}</span>
                                    <span className="text-xs text-gray-500">{column.type}</span>
                                    {column.primaryKey && (
                                      <span className="text-xs bg-yellow-600 text-yellow-100 px-1 rounded">PK</span>
                                    )}
                                    {!column.nullable && (
                                      <span className="text-xs bg-red-600 text-red-100 px-1 rounded">NN</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 p-3 bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Database Stats</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Total Tables:</span>
                <span className="text-blue-400">{tables.length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Total Columns:</span>
                <span className="text-green-400">
                  {tables.reduce((sum, table) => sum + table.columns.length, 0)}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Total Records:</span>
                <span className="text-purple-400">
                  {tables.reduce((sum, table) => sum + table.data.length, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Connected to: fastdb
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
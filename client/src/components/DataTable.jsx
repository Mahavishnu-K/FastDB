// components/DataTable.jsx
import React, { useState } from 'react';
import { Table, Search, Filter, Download } from 'lucide-react';

const DataTable = ({ table, title = null }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!table || !table.data || table.data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center shadow-lg">
        <Table className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">No Data Available</h3>
        <p className="text-gray-500">Execute a query to see results here</p>
      </div>
    );
  }

  const columns = Object.keys(table.data[0]);
  const filteredData = table.data.filter(row =>
    columns.some(col =>
      row[col]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="bg-gray-900 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Table className="w-5 h-5 text-blue-400" />
          <span>{title || `Table: ${table.name}`}</span>
          <span className="text-sm text-gray-400">({table.data.length} rows)</span>
        </h4>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              {columns.map((column) => (
                <th key={column} className="text-left text-gray-300 font-medium py-3 px-4 bg-gray-750">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr 
                key={idx} 
                className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
              >
                {columns.map((column, cellIdx) => (
                  <td key={cellIdx} className="text-gray-300 py-3 px-4">
                    <span className={`${
                      typeof row[column] === 'number' ? 'font-mono' : ''
                    }`}>
                      {row[column]?.toString() || '-'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-400">
          <Search className="w-8 h-8 mx-auto mb-2" />
          <p>No results found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default DataTable;
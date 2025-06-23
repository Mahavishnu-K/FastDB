import { Database, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import * as api from '../services/apiServices';

const Schema = ({ tables, onTableDelete }) => {
  const [selectedTable, setSelectedTable] = useState(null);

  const navigate = useNavigate(); // Hook for navigation

  const handleCreateTable = () => {
    navigate('/table/new'); // Navigate to the editor
  };

  const handleExportSQL = async () => {
    try {
        const sqlScript = await api.exportSchemaSQL(selectedTable); // You need to track selected DB here
        const blob = new Blob([sqlScript], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'schema.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (err) {
        alert('Failed to export schema.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Database Schema</h2>
          <p className="text-gray-400">Manage your database structure</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportSQL}
            className="border border-gray-600 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Export SQL</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gray-950 border border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
              <Database className="w-5 h-5 text-blue-400" />
              <span>Tables ({tables.length})</span>
            </h3>
            <button onClick={handleCreateTable} className="border border-gray-600 hover:bg-gray-900 text-white p-2 rounded-md">
              <Plus className="w-4 h-4" />
            </button>
            <div className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedTable?.id === table.id 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-900 hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{table.name}</div>
                      <div className="text-sm opacity-75">{table.rowCount} rows</div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onTableDelete(table.name); }}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          {selectedTable ? (
            <div className="bg-gray-950 border border-gray-600 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">{selectedTable.name}</h3>
              <h4 className="text-lg font-medium text-white mb-3">Columns</h4>
              <div className="space-y-3">
                {selectedTable.columns.map((column, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium">{column.name}</span>
                      <span className="text-gray-400 text-sm ml-4">{column.type}</span>
                    </div>
                    <div className="flex space-x-2">
                      {column.primary_key && (
                        <span className="border border-yellow-600 bg-yellow-900/50 text-yellow-400 text-xs px-2 py-1 rounded">
                          PK
                        </span>
                      )}
                      {!column.nullable && (
                        <span className="border border-gray-600 text-gray-400 text-xs px-2 py-1 rounded">
                          NOT NULL
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-950 border border-gray-600 rounded-lg p-12 text-center">
              <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Table</h3>
              <p className="text-gray-500">Choose a table to view its structure</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schema;
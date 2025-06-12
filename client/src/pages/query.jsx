import React, { useState } from 'react';
import NLInput from '../components/NLPinput';
import SQLDisplay from '../components/SQLDisplay';
import DataTable from '../components/DataTable';
import { Clock, Save, History } from 'lucide-react';

const Query = ({ 
  tables, 
  currentSQL, 
  isLoading, 
  queryResult, 
  handleNLCommand 
}) => {
  const [queryHistory, setQueryHistory] = useState([
    { id: 1, query: 'Show all students', timestamp: '2024-01-15 10:30:00', type: 'SELECT' },
    { id: 2, query: 'Create table for products', timestamp: '2024-01-15 10:25:00', type: 'CREATE' },
    { id: 3, query: 'Add new student John', timestamp: '2024-01-15 10:20:00', type: 'INSERT' },
    { id: 4, query: 'Update student John\'s grade to A', timestamp: '2024-01-15 10:15:00', type: 'UPDATE' },
    { id: 5, query: 'Delete student record for Mike', timestamp: '2024-01-15 10:10:00', type: 'DELETE' }
  ]);

  const [savedQueries, setSavedQueries] = useState([
    { id: 1, name: 'All Students Query', query: 'SELECT * FROM students;' },
    { id: 2, name: 'Product Count', query: 'SELECT COUNT(*) FROM products;' }
  ]);

  const handleSaveQuery = () => {
    if (currentSQL) {
      const newQuery = {
        id: savedQueries.length + 1,
        name: `Query ${savedQueries.length + 1}`,
        query: currentSQL
      };
      setSavedQueries([...savedQueries, newQuery]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Query Interface</h2>
        <p className="text-gray-400">Execute queries and explore your data</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NLInput onExecute={handleNLCommand} isLoading={isLoading} />
          
          {currentSQL && (
            <div className="relative">
              <SQLDisplay sql={currentSQL} />
              {currentSQL && (
                <button
                  onClick={handleSaveQuery}
                  className="absolute top-4 right-20 bg-gray-900 border border-gray-600 text-white hover:bg-gray-700 px-3 py-1 rounded text-sm flex items-center space-x-1"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>
              )}
            </div>
          )}
          
          {queryResult && (
            <DataTable table={queryResult} title="Query Results" />
          )}
        </div>

        <div className="space-y-6">
          {/* Query History */}
          <div className="bg-gray-950 border border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <History className="w-5 h-5 text-orange-400" />
              <span>Query History</span>
            </h3>
            <div className="pr-2 h-60 overflow-y-scroll">
              <div className="space-y-2">
                {queryHistory.map((item) => (
                  <div key={item.id} className="bg-gray-800 rounded p-3 hover:bg-gray-900 transition-colors cursor-pointer">
                    <div className="text-sm text-white font-medium">{item.query}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{item.timestamp}</span>
                      <span className={"text-xs border border-gray-600 px-2 py-1 rounded text-gray-400"}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Saved Queries */}
          <div className="bg-gray-950 border border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Save className="w-5 h-5 text-green-400" />
              <span>Saved Queries</span>
            </h3>
            <div className="pr-2 h-40 overflow-y-scroll">
              <div className="space-y-2">
                {savedQueries.map((query) => (
                  <div key={query.id} className="bg-gray-800 rounded p-3 hover:bg-gray-900 transition-colors cursor-pointer">
                    <div className="text-sm text-white font-medium">{query.name}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">
                      {query.query.substring(0, 40)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-950 border border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => handleNLCommand('Show all tables')}
                className="w-full text-left bg-gray-800 hover:bg-gray-900 text-white p-3 rounded transition-colors"
              >
                Show All Tables
              </button>
              <button 
                onClick={() => handleNLCommand('Show table structure')}
                className="w-full text-left bg-gray-800 hover:bg-gray-900 text-white p-3 rounded transition-colors"
              >
                View Table Structure
              </button>
              <button 
                onClick={() => handleNLCommand('Count all records')}
                className="w-full text-left bg-gray-800 hover:bg-gray-900 text-white p-3 rounded transition-colors"
              >
                Count All Records
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Query;
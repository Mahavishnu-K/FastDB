import React, { useState, useEffect } from 'react';
import NLInput from '../components/NLPinput';
import SQLDisplay from '../components/SQLDisplay';
import DataTable from '../components/DataTable';
import { History, Save } from 'lucide-react';
import * as api from '../services/apiServices';

const Query = ({ 
  tables, 
  currentSQL, 
  isLoading, 
  queryResult, 
  handleNLCommand,
  error
}) => {
  const [queryHistory, setQueryHistory] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setQueryHistory(await api.getQueryHistory());
        setSavedQueries(await api.getSavedQueries());
      } catch (err) {
        console.error("Failed to fetch history/saved queries:", err);
      }
    };
    fetchData();
  }, []);

  const handleSaveQuery = async () => {
    if (currentSQL) {
      const name = prompt("Enter a name for this query:", "My Saved Query");
      if (name) {
        try {
          const newSavedQuery = await api.saveQuery(name, currentSQL);
          setSavedQueries([...savedQueries, newSavedQuery]);
        } catch (err) {
          alert("Failed to save query.");
        }
      }
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
              <button
                onClick={handleSaveQuery}
                className="absolute top-4 right-20 bg-gray-900 border border-gray-600 text-white hover:bg-gray-700 px-3 py-1 rounded text-sm flex items-center space-x-1"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          )}
          
          {!error && queryResult && (
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
            <div className="pr-2 h-60 overflow-y-auto">
              <div className="space-y-2">
                {queryHistory.map((item) => (
                  <div key={item.id} className="bg-gray-800 rounded p-3">
                    <div className="text-sm text-white font-mono font-medium truncate">{item.generated_sql}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{new Date(item.executed_at).toLocaleString()}</span>
                      <span className={`text-xs border px-2 py-0.5 rounded ${item.status === 'success' ? 'border-green-600 text-green-400' : 'border-red-600 text-red-400'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Saved Queries component can be built out similarly */}
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
        </div>
      </div>
    </div>
  );
};

export default Query;
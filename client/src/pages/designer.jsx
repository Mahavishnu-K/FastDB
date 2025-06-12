import React from 'react';
import NLInput from '../components/NLPinput';
import SQLDisplay from '../components/SQLDisplay';
import DataTable from '../components/DataTable';
import ERDiagram from '../components/ERDiagram';

const Designer = ({ 
  tables, 
  currentSQL, 
  isLoading, 
  queryResult, 
  handleNLCommand 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Database Designer</h2>
        <p className="text-gray-400">Design your database schema using natural language</p>
      </div>

      <NLInput onExecute={handleNLCommand} isLoading={isLoading} />
      
      {currentSQL && <SQLDisplay sql={currentSQL} />}
      
      {queryResult && (
        <DataTable table={queryResult} title="Query Results" />
      )}
      
      <ERDiagram tables={tables} />
      
      {/* Quick Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-2">{tables.length}</div>
          <div className="text-gray-400">Tables Created</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-400 mb-2">
            {tables.reduce((sum, table) => sum + table.columns.length, 0)}
          </div>
          <div className="text-gray-400">Total Columns</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-2">
            {tables.reduce((sum, table) => sum + table.data.length, 0)}
          </div>
          <div className="text-gray-400">Total Records</div>
        </div>
      </div> */}
    </div>
  );
};

export default Designer;
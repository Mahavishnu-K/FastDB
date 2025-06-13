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
      
    </div>
  );
};

export default Designer;
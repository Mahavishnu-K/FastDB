import React from 'react';
import NLInput from '../components/NLPinput';
import SQLDisplay from '../components/SQLDisplay';
import DataTable from '../components/DataTable';
import ERDiagram from '../components/ERDiagram';

const Designer = ({ 
  tables, 
  mermaidString, // Get the new prop
  currentSQL, 
  isLoading, 
  queryResult, 
  handleNLCommand,
  error
}) => {
  return (
    <div className="space-y-6">
      {/* ... NLInput, SQLDisplay, DataTable are the same ... */}
      <NLInput onExecute={handleNLCommand} isLoading={isLoading} />
      {currentSQL && <SQLDisplay sql={currentSQL} />}
      {!error && queryResult && <DataTable table={queryResult} title="Query Results" />}
      
      {/* Pass the mermaid string down */}
      <ERDiagram mermaidString={mermaidString} />
    </div>
  );
};
export default Designer;
import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Designer from './pages/Designer';
import Query from './pages/Query';
import Schema from './pages/Schema';
import API from './pages/API';
import TableEditor from './pages/TableEditor';

// Import all API functions
import * as api from './services/apiServices';

// Keep the same helper function
const transformQueryResult = (queryResult) => {
  if (!queryResult?.result?.columns || !queryResult?.result?.data) {
    return null;
  }
  const { columns, data } = queryResult.result;
  if (data.length > 0 && Array.isArray(data[0])) {
    return { data: data.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]]))) };
  }
  return { data: data };
};


function AppContent() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [schema, setSchema] = useState([]);
  const [mermaidString, setMermaidString] = useState(''); // New state for ER diagram
  const [currentSQL, setCurrentSQL] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- DATA FETCHING HOOKS ---

  const fetchDatabases = useCallback(async () => {
    try {
      setError('');
      const dbList = await api.listDatabases();
      const defaultDb = 'fastDB';
      const sortedDbList = [defaultDb, ...dbList.filter(db => db !== defaultDb)];
      setDatabases(sortedDbList);
      if (sortedDbList.length > 0 && !selectedDb) {
        setSelectedDb(sortedDbList[0]);
      }
    } catch (err) {
      setError('Failed to fetch databases. Is the backend running?');
    }
  }, [selectedDb]);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchSchemaAndDiagram = useCallback(async () => {
    if (!selectedDb) return;
    setIsLoading(true);
    try {
      setError('');
      // Fetch both schema and diagram concurrently
      const [schemaData, mermaidData] = await Promise.all([
        api.getDatabaseSchema(selectedDb),
        api.getMermaidDiagram(selectedDb)
      ]);
      
      const formattedSchema = schemaData.tables.map(table => ({
        id: table.name,
        name: table.name,
        columns: table.columns,
        rowCount: table.row_count,
      }));
      setSchema(formattedSchema);
      setMermaidString(mermaidData);

    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(`Failed to fetch schema for ${selectedDb}: ${errorMsg}`);
      setSchema([]);
      setMermaidString('');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDb]);

  useEffect(() => {
    fetchSchemaAndDiagram();
  }, [selectedDb, fetchSchemaAndDiagram]);

  // --- HANDLER FUNCTIONS ---

  const handleNLCommand = async (input) => {
    if (!selectedDb) {
      setError('Please select a database first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setCurrentSQL('');
    setQueryResult(null);

    try {
      // Step 1: Always convert NL to SQL first
      const nlResponse = await api.convertNlToSql(input, selectedDb);
      if (nlResponse.query_type === "ERROR") throw new Error(nlResponse.explanation);
      setCurrentSQL(nlResponse.sql);

      // --- START OF NEW LOGIC FOR SWITCHING ---
      const queryType = nlResponse.query_type.toUpperCase();
      const upperSql = nlResponse.sql.toUpperCase();

      // Check if this is a database switching command
      const isSwitchCommand = (queryType === 'OTHER' || queryType === 'USE') && (upperSql.includes('SWITCH') || upperSql.includes('USE '));
      
      if (isSwitchCommand) {
        // Find the target database name from the LLM's extracted values
        const targetDb = nlResponse.extracted_values?.text_values?.[0];

        if (targetDb && databases.includes(targetDb.toLowerCase())) {
          setSelectedDb(targetDb.toLowerCase());
          setQueryResult({ // Provide user feedback
            success: true,
            message: `Successfully switched to database: ${targetDb.toLowerCase()}`
          });
        } else if (targetDb) {
           setError(`Database '${targetDb}' does not exist. Cannot switch.`);
           setQueryResult(null);
        } else {
           setError("Could not determine which database to switch to.");
           setQueryResult(null);
        }
        setIsLoading(false); // Stop here, no need to execute SQL
        return; 
      }
      // --- END OF NEW LOGIC FOR SWITCHING ---

      const execResponse = await api.executeSql(nlResponse.sql, selectedDb);
      setQueryResult(execResponse);

      if (['CREATE', 'ALTER', 'DROP'].includes(queryType) && upperSql.includes('DATABASE')) {
        setTimeout(async () => {
          const freshDbList = await api.listDatabases();
          setDatabases(freshDbList);
          if (queryType === 'CREATE') {
            const match = upperSql.match(/CREATE DATABASE\s+("?)([\w\d_]+)\1/);
            if (match && match[2]) {
              const newDbName = match[2].toLowerCase();
              setSelectedDb(newDbName);
            }
          } else {
            setSelectedDb('fastDB');
          }
        }, 1000);
      } else if (['CREATE', 'ALTER', 'DROP'].includes(queryType)) {
          setTimeout(() => fetchSchemaAndDiagram(), 500);
      }

    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message;
      setError(`Command failed: ${errorDetail}`);
    } finally {
      if (isLoading) setIsLoading(false); // Ensure loading is always turned off
    }
  };
  
  const handleTableSelect = async (table) => {
    if (!selectedDb) return;
    setIsLoading(true);
    try {
      const tableDataResponse = await api.getTableData(table.name, selectedDb);
      setQueryResult(tableDataResponse);
      setCurrentSQL(`SELECT * FROM ${table.name};`);
    } catch (err) {
      setError(`Failed to fetch data for table ${table.name}: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTableDelete = async (tableName) => {
    if (!selectedDb || !window.confirm(`Are you sure you want to delete the table "${tableName}"?`)) return;
    setIsLoading(true);
    try {
      await api.deleteTable(tableName, selectedDb);
      await fetchSchemaAndDiagram(); // Refresh both
    } catch (err) {
      setError(`Failed to delete table: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTableSuccess = () => {
    fetchSchemaAndDiagram();
    navigate('/schema');
  };

  const TableEditorWrapper = () => (
    <TableEditor 
      selectedDb={selectedDb} 
      onSaveSuccess={handleCreateTableSuccess}
      onCancel={() => navigate('/schema')}
    />
  );

  const commonProps = {
    tables: schema,
    mermaidString, // Pass diagram string
    currentSQL,
    isLoading,
    queryResult: transformQueryResult(queryResult), 
    handleNLCommand,
    error,
  };
  
  return (
    <div className="min-h-screen w-full bg-gray-950 overflow-x-hidden">
      <Header onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        databases={databases}
        selectedDb={selectedDb}
        onDbChange={setSelectedDb}
        tables={schema}
        onTableSelect={handleTableSelect}
      />
      <main className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'} w-full ${isSidebarOpen ? 'lg:w-[calc(100%-20rem)]' : 'w-full'} min-w-0 overflow-x-hidden`}>
        <div className="container mx-auto px-6 py-8 max-w-full">
          {error && <div className="bg-red-900 border border-red-700 text-white p-4 rounded-lg mb-4"><strong>Error:</strong> {error}</div>}
          <Routes>
            <Route path="/" element={<Navigate to="/designer" replace />} />
            <Route path="/designer" element={<Designer {...commonProps} />} />
            <Route path="/query" element={<Query {...commonProps} />} />
            <Route path="/schema" element={<Schema tables={schema} onTableDelete={handleTableDelete} />} />
            <Route path="/apiDoc" element={<API/>} />
            <Route path="/table/new" element={<TableEditorWrapper />} />
            <Route path="*" element={<Navigate to="/designer" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
    );
}
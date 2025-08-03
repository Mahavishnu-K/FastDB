import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Layout & Route Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/protectedRoute';

// Page Components
import Designer from './pages/Designer';
import Query from './pages/Query';
import Schema from './pages/Schema';
import API from './pages/API';
import TableEditor from './pages/TableEditor';
import LoginPage from './pages/login';

// API Services
import * as api from './services/apiServices';
import { initializeApiClient } from './services/apiServices';

// Helper function to transform query results for display
const transformQueryResult = (queryResult) => {
  if (!queryResult?.result?.columns || !queryResult?.result?.data) {
    return null;
  }
  return { data: queryResult.result.data };
};


// The main application layout for authenticated users.
function DashboardLayout() {
  const navigate = useNavigate();

  // State management for the dashboard
  const [databases, setDatabases] = useState([]); // Now an array of objects
  const [selectedDb, setSelectedDb] = useState('');
  const [schema, setSchema] = useState([]);
  const [mermaidString, setMermaidString] = useState('');
  const [currentSQL, setCurrentSQL] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Data Fetching Logic ---

  const fetchDatabases = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      const dbList = await api.listDatabases(); // Returns [{id, virtual_name}, ...]
      
      setDatabases(dbList);
      
      const currentSelectionIsValid = dbList.some(db => db.virtual_name === selectedDb);
      if (dbList.length > 0 && (!selectedDb || !currentSelectionIsValid)) {
        // Default to the first database in the list if none is selected or the old one is gone.
        setSelectedDb(dbList[0].virtual_name);
      } else if (dbList.length === 0) {
        setSelectedDb('');
      }
    } catch (err) {
      setError('Failed to fetch databases. Please try again.');
      setDatabases([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDb]);

  const fetchSchemaAndDiagram = useCallback(async () => {
    if (!selectedDb) {
        setSchema([]);
        setMermaidString('');
        return;
    };
    try {
      setError('');
      setIsLoading(true);
      const [schemaData, mermaidData] = await Promise.all([
        api.getDatabaseSchema(selectedDb),
        api.getMermaidDiagram(selectedDb)
      ]);
      const formattedSchema = schemaData.tables.map(table => ({
        id: table.name, name: table.name, columns: table.columns, rowCount: table.row_count,
      }));
      setSchema(formattedSchema);
      if (schemaData.tables && schemaData.tables.length > 0) {
        const mermaidData = await api.getMermaidDiagram(selectedDb);
        setMermaidString(mermaidData);
      } else {
        setMermaidString(''); 
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(`Failed to fetch schema for ${selectedDb}: ${errorMsg}`);
      setSchema([]);
      setMermaidString('');
    } finally {
        setIsLoading(false);
    }
  }, [selectedDb]);

  // Initial fetch for the list of databases
  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  // Fetch the schema whenever the selected database changes
  useEffect(() => {
    fetchSchemaAndDiagram();
  }, [selectedDb, fetchSchemaAndDiagram]);


  // --- Event Handlers ---

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
      // Use the unified /query/ endpoint for everything for simplicity and power
      const execResponse = await api.executeCommand(input, selectedDb);
      
      // Update state based on response
      setCurrentSQL(execResponse.generated_sql || input);
      setQueryResult(execResponse);

      // Check if a database was created or dropped to refresh the list
      const upperSql = (execResponse.generated_sql || input).toUpperCase();
      if (upperSql.includes('CREATE DATABASE') || upperSql.includes('DROP DATABASE')) {
        setTimeout(() => fetchDatabases(), 1000); // Refresh DB list after a short delay
      } else if (upperSql.includes('CREATE TABLE') || upperSql.includes('DROP TABLE') || upperSql.includes('ALTER TABLE')) {
        setTimeout(() => fetchSchemaAndDiagram(), 500); // Refresh schema after a short delay
      }
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message;
      setError(`Command failed: ${errorDetail}`);
    } finally {
      setIsLoading(false); 
    }
  };

  const handleTableSelect = async (table) => {
    if (table.rowCount === 0) {
      setCurrentSQL(`SELECT * FROM "${table.name}";`);
      // Set the result to an empty state without an API call.
      setQueryResult({
        success: true,
        message: "Table is empty.",
        result: { columns: table.columns.map(c => c.name), data: [] }
      });
      console.log(`Skipped fetching data for empty table: ${table.name}`);
      return; // Stop the function here
    }
    if (!selectedDb) return;
    setIsLoading(true);
    try {
      const sql = `SELECT * FROM "${table.name}" LIMIT 100;`;
      const tableDataResponse = await api.executeCommand(sql, selectedDb);
      setQueryResult(tableDataResponse);
      setCurrentSQL(sql);
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
      // Use the powerful executeSql for this action as well
      await api.executeCommand(`DROP TABLE "${tableName}";`, selectedDb);
      await fetchSchemaAndDiagram(); // Refresh schema on success
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    // Force a full page reload to clear all state and redirect to login
    window.location.href = '/login';
  };

  const TableEditorWrapper = () => (
    <TableEditor selectedDb={selectedDb} onSaveSuccess={handleCreateTableSuccess} onCancel={() => navigate('/schema')} />
  );
  
  const commonProps = {
    tables: schema, mermaidString, currentSQL, isLoading, 
    queryResult: transformQueryResult(queryResult), handleNLCommand, error,
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 overflow-x-hidden">
      <Header onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        databases={databases} // Pass array of objects
        selectedDb={selectedDb}
        onDbChange={setSelectedDb}
        tables={schema}
        onTableSelect={handleTableSelect}
        onLogout={handleLogout}
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

// --- Main App Component ---
// This component's only job is to handle routing and auth initialization.
export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This effect runs only once when the app first loads.
    const token = localStorage.getItem('accessToken');
    if (token) {
      // If a token exists, configure the API client to use it for all requests.
      initializeApiClient(token);
    }
    // Mark the app as initialized so we can proceed with rendering.
    setIsInitialized(true);
  }, []);

  // Render a loading state until the initial token check is complete.
  // This prevents race conditions where data is fetched before the API client is ready.
  if (!isInitialized) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
            Loading Application...
        </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}
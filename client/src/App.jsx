import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

// Layout, Route, & Core Components
import { CommandPalette, CommandPaletteProvider, useCommandPalette } from './components/command/CommandPalette';
import Header from './components/Header';
import ProtectedRoute from './components/protectedRoute';
import Scratchpad from './components/ScratchPad';
import Sidebar from './components/Sidebar';
import WelcomeModal from './components/WelcomeModal';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { InputProvider } from './contexts/InputContext';
import { UserProvider, useUser } from './contexts/UserContext';

// State Management
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/useAppStore';

// API Services
import CollaborationPage from './pages/Collaboration';
import * as api from './services/apiServices';

// --- Lazy-loaded Page Components ---
const Query = lazy(() => import('./pages/Query'));
const Schema = lazy(() => import('./pages/Schema'));
const API = lazy(() => import('./pages/API'));
const TableEditor = lazy(() => import('./pages/TableEditor'));
const EditTable = lazy(() => import('./pages/EditTable'));
const LoginPage = lazy(() => import('./pages/login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SavedQueries = lazy(() => import('./pages/SavedQueries'));
const SchemaBuilder = lazy(() => import('./pages/SchemaBuilder'));

const queryClient = new QueryClient();

function DashboardLayout() {
  const navigate = useNavigate();
  const { setActions } = useCommandPalette();
  const { user, logout, isLoading: isUserLoading } = useUser(); // --- Get user and loading state
  const [isScratchpadVisible, setIsScratchpadVisible] = useState(false);

  const { 
    initialize, fetchSchemaAndDiagram, handleDbChange, toggleSidebar,
    databases, selectedDb, schema, appIsLoading, error, isSidebarOpen 
  } = useAppStore();

  // --- THE FIX: Make app initialization dependent on the user being loaded ---
  useEffect(() => {
    // Only initialize the app store's data (like databases) AFTER the user is confirmed to be loaded.
    if (!isUserLoading && user) {
      initialize();
    }
  }, [isUserLoading, user, initialize]);


  useEffect(() => {
    const actions = [
      { id: 'nav_dashboard', title: 'Navigate: Go to Dashboard', onSelect: () => navigate('/dashboard') },
      { id: 'nav_query', title: 'Navigate: Go to Query Page', onSelect: () => navigate('/query') },
      { id: 'nav_schema', title: 'Navigate: Go to Schema Page', onSelect: () => navigate('/schema') },
      { id: 'nav_saved', title: 'Navigate: Go to Saved Queries', onSelect: () => navigate('/saved-queries') },
      { id: 'nav_api', title: 'Navigate: Go to API Page', onSelect: () => navigate('/api') },
      { id: 'create_table', title: 'Action: Create New Table', onSelect: () => navigate('/table/new') },
      { id: 'schema_builder', title: 'Action: Open Schema Builder', onSelect: () => navigate('/schema/builder') },
      { id: 'refresh_schema', title: 'Action: Refresh Schema', onSelect: () => fetchSchemaAndDiagram(selectedDb) },
      { id: 'toggle_sidebar', title: 'Action: Toggle Sidebar', onSelect: toggleSidebar },
      { id: 'toggle_scratchpad', title: 'Action: Toggle Scratchpad', onSelect: () => setIsScratchpadVisible(p => !p) },
      { id: 'logout', title: 'Action: Logout', onSelect: logout },
    ];

    schema.tables.forEach(table => {
        actions.push({
            id: `query_table_${table.name}`,
            title: `Query: Show all from "${table.name}"`,
            onSelect: () => navigate('/query', { state: { autoQuery: `select * from ${table.name}` }})
        });
    });

    setActions(actions);
  }, [schema.tables, navigate, setActions, fetchSchemaAndDiagram, logout, selectedDb, toggleSidebar]);

  const handleTableSelect = (table, dbName) => {
    if (dbName && selectedDb !== dbName) handleDbChange(dbName);
    navigate('/query', { state: { autoQuery: `select * from ${table.name}` } });
  };
  
  const handleTableDelete = async (tableName) => {
      await api.deleteTable(tableName, selectedDb);
      fetchSchemaAndDiagram(selectedDb);
  };
  
  const handleSaveSuccess = () => {
      fetchSchemaAndDiagram(selectedDb);
      navigate('/schema');
  };

  // --- Display a loading indicator for the entire layout while the user is being authenticated ---
  if (isUserLoading) {
      return <div className="flex items-center justify-center h-screen bg-bg-light dark:bg-bg-dark">Authenticating...</div>;
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      <WelcomeModal />
      <Scratchpad isVisible={isScratchpadVisible} onClose={() => setIsScratchpadVisible(false)} />
      <Sidebar
        isOpen={isSidebarOpen} onToggle={toggleSidebar}
        databases={databases} selectedDb={selectedDb} onDbChange={handleDbChange}
        onTableSelect={handleTableSelect} onLogout={logout} 
      />
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
        <Header onSidebarToggle={toggleSidebar} onScratchpadToggle={() => setIsScratchpadVisible(p => !p)} />
        <main className="p-4 sm:p-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4" role="alert"><strong>Error:</strong> {error}</div>}
          
          <Suspense fallback={<div className="p-4 text-center">Loading Page...</div>}>
            {appIsLoading && !error && <div className="p-4 text-center">Loading application state...</div>}
            {!appIsLoading && (
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/query" element={<Query key={selectedDb} />} />
                  <Route path="/schema" element={<Schema onTableDelete={handleTableDelete} />} />
                  <Route path="/schema/builder" element={<SchemaBuilder />} />
                  <Route path="/saved-queries" element={<SavedQueries />} />
                  <Route path="/collaboration" element={<CollaborationPage />} />
                  {/* <Route path="/api" element={<API />} /> */}
                  <Route path="/table/new" element={<TableEditor onSaveSuccess={handleSaveSuccess} onCancel={() => navigate('/schema')} />} />
                  <Route path="/table/edit/:tableName" element={<EditTable onSaveSuccess={handleSaveSuccess} onCancel={() => navigate('/schema')} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const CommandPaletteHotkeys = () => {
        const commandPalette = useCommandPalette();
        useEffect(() => {
            const onKeyDown = (e) => {
                if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    commandPalette.toggle();
                }
            };
            document.addEventListener('keydown', onKeyDown);
            return () => document.removeEventListener('keydown', onKeyDown);
        }, [commandPalette]);
        return null;
    }

    return (
        <Router>
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <CommandPaletteProvider>
                <ConfirmationProvider>
                  <InputProvider>
                    <CommandPaletteHotkeys />
                    <CommandPalette />
                    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-bg-light dark:bg-bg-dark">Loading...</div>}>
                      <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
                      </Routes>
                    </Suspense>
                  </InputProvider>
                </ConfirmationProvider>
              </CommandPaletteProvider>
            </UserProvider>
          </QueryClientProvider>
        </Router>
    );
}
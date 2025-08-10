import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

// Layout, Route, & Core Components
import Header from './components/header';
import Sidebar from './components/Sidebar';
import { CommandPalette, useCommandPalette } from './components/command/CommandPalette';
import ProtectedRoute from './components/protectedRoute';
import WelcomeModal from './components/WelcomeModal';
import { useUser } from './contexts/UserContext';

// State Management
import { useAppStore } from './store/useAppStore';

// API Services
import * as api from './services/apiServices';
import { initializeApiClient } from './services/apiServices';

// --- Lazy-loaded Page Components ---
const Query = lazy(() => import('./pages/Query'));
const Schema = lazy(() => import('./pages/Schema'));
const API = lazy(() => import('./pages/API'));
const TableEditor = lazy(() => import('./pages/TableEditor'));
const EditTable = lazy(() => import('./pages/EditTable'));
const LoginPage = lazy(() => import('./pages/login'));
const CollaborationPage = lazy(() => import('./pages/Collaboration'));

function DashboardLayout() {
  const navigate = useNavigate();
  const { setActions } = useCommandPalette();
  const { logout } = useUser();

  const { 
    initialize, fetchSchemaAndDiagram, handleDbChange, toggleSidebar,
    databases, selectedDb, schema, mermaidString, appIsLoading, error, isSidebarOpen 
  } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const actions = [
      { id: 'nav_query', title: 'Navigate: Go to Query Page', onSelect: () => navigate('/query') },
      { id: 'nav_schema', title: 'Navigate: Go to Schema Page', onSelect: () => navigate('/schema') },
      { id: 'nav_api', title: 'Navigate: Go to API Page', onSelect: () => navigate('/api') },
      { id: 'create_table', title: 'Action: Create New Table', onSelect: () => navigate('/table/new') },
      { id: 'refresh_schema', title: 'Action: Refresh Schema', onSelect: () => fetchSchemaAndDiagram(selectedDb) },
      { id: 'toggle_sidebar', title: 'Action: Toggle Sidebar', onSelect: toggleSidebar },
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

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      <WelcomeModal />
      <Sidebar
        isOpen={isSidebarOpen} onToggle={toggleSidebar}
        databases={databases} selectedDb={selectedDb} onDbChange={handleDbChange}
        onTableSelect={handleTableSelect} onLogout={logout} 
      />
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
        <Header onSidebarToggle={toggleSidebar} />
        <main className="p-4 sm:p-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4" role="alert"><strong>Error:</strong> {error}</div>}
          
          <Suspense fallback={<div className="p-4 text-center">Loading Page...</div>}>
            {appIsLoading && !error && <div className="p-4 text-center">Loading application state...</div>}
            {!appIsLoading && (
                <Routes>
                  <Route path="/query" element={<Query key={selectedDb} />} />
                  <Route path="/schema" element={<Schema onTableDelete={handleTableDelete} />} />
                  <Route path="/api" element={<API />} />
                  <Route path="/collaboration" element={<CollaborationPage />} />
                  <Route path="/table/new" element={<TableEditor onSaveSuccess={handleSaveSuccess} onCancel={() => navigate('/schema')} />} />
                  <Route path="/table/edit/:tableName" element={<EditTable onSaveSuccess={handleSaveSuccess} onCancel={() => navigate('/schema')} />} />
                  <Route path="*" element={<Navigate to="/query" replace />} />
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
          <CommandPaletteHotkeys />
          <CommandPalette />
          <Suspense fallback={<div className="flex items-center justify-center h-screen bg-bg-light dark:bg-bg-dark">Loading...</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </Router>
    );
}
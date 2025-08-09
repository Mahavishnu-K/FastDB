import React, { useState, useMemo } from 'react';
import { Database, Table, Eye, ListTree, X, LogOut, ChevronRight, Minus, Loader, Search, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import * as api from '../services/apiServices';
import ThemeSwitcher from './ThemeSwitcher';

const SkeletonLoader = () => (
    <div className="p-2 space-y-3">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 flex-1 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
        ))}
    </div>
);

const Sidebar = ({ isOpen, onToggle, databases, selectedDb, onDbChange, onTableSelect, onLogout }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [cachedSchemas, setCachedSchemas] = useState({});
  const [loadingSchemaFor, setLoadingSchemaFor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleExpand = async (itemId, itemType, dbName) => {
    const isCurrentlyExpanded = expandedItems.has(itemId);

    if (itemType === 'db' && !isCurrentlyExpanded && !cachedSchemas[dbName]) {
      setLoadingSchemaFor(dbName);
      try {
        const schemaResult = await api.getDatabaseSchema(dbName);
        const formattedSchema = {
          tables: schemaResult.tables.map(t => ({ ...t, id: t.name, rowCount: t.row_count })),
          views: schemaResult.views || [],
          indexes: schemaResult.indexes || [],
        };
        setCachedSchemas(prev => ({ ...prev, [dbName]: formattedSchema }));
      } catch (err) {
        console.error(`Failed to fetch schema for ${dbName}:`, err);
      } finally {
        setLoadingSchemaFor(null);
      }
    }

    setExpandedItems(prev => {
      const newSet = new Set(prev);
      isCurrentlyExpanded ? newSet.delete(itemId) : newSet.add(itemId);
      return newSet;
    });
  };

  const filteredDatabases = useMemo(() => {
    if (!searchTerm) return databases;
    const lowercasedFilter = searchTerm.toLowerCase();

    return databases.filter(db => {
        const dbNameMatch = db.virtual_name.toLowerCase().includes(lowercasedFilter);
        if (dbNameMatch) return true;

        const schema = cachedSchemas[db.virtual_name];
        if (schema) {
            const tableMatch = schema.tables.some(table => table.name.toLowerCase().includes(lowercasedFilter));
            if (tableMatch) return true;
        }
        return false;
    });
  }, [databases, searchTerm, cachedSchemas]);


  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onToggle} />}
      <aside className={`fixed left-0 top-0 h-full bg-fg-light dark:bg-fg-dark border-r border-border-light dark:border-border-dark z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-72 flex flex-col`}>
        <div className="flex items-center justify-between p-3.5 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold">Schema Explorer</span>
          </div>
          <button onClick={onToggle} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 border-b border-border-light dark:border-border-dark">
            <div className="relative">
                <Search className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark absolute left-2.5 top-1/2 -translate-y-1/2"/>
                <input 
                    type="search"
                    placeholder="Search schema..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-bg-light dark:bg-bg-dark text-sm border border-border-light dark:border-border-dark rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredDatabases.map(db => {
            const isActive = db.virtual_name === selectedDb;
            const isDbExpanded = expandedItems.has(db.id);
            const dbSchema = cachedSchemas[db.virtual_name];

            return (
              <div key={db.id}>
                <div className={`group flex items-center p-2 rounded-md ${isActive ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <button onClick={() => handleToggleExpand(db.id, 'db', db.virtual_name)} className="p-0.5 mr-1">
                    <motion.div animate={{ rotate: isDbExpanded ? 90 : 0 }}><ChevronRight className="w-3.5 h-3.5" /></motion.div>
                  </button>
                  <Database className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm font-medium flex-1 cursor-default">{db.virtual_name}</span>
                  <div className="ml-auto">
                    {isActive ? (
                      <div className="flex items-center space-x-1.5 text-xs text-green-500 font-semibold">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Connected</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onDbChange(db.virtual_name)}
                        className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {isDbExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="pl-5 border-l border-border-light dark:border-border-dark ml-4 space-y-1 mt-1 overflow-hidden">
                    {loadingSchemaFor === db.virtual_name && <SkeletonLoader />}
                    {dbSchema && (
                      <>
                        {dbSchema.tables.map(table => {
                          const isTableExpanded = expandedItems.has(table.id);
                          return (
                            <div key={table.id}>
                              <div className="flex items-center p-1.5 rounded-md group hover:bg-slate-100 dark:hover:bg-slate-800">
                                <button onClick={() => handleToggleExpand(table.id, 'table')} className="p-0.5 mr-1">
                                  <motion.div animate={{ rotate: isTableExpanded ? 90 : 0 }}><ChevronRight className="w-3.5 h-3.5" /></motion.div>
                                </button>
                                <Table className="w-4 h-4 text-blue-500 mr-2" />
                                <span onClick={() => onTableSelect(table, db.virtual_name)} className="text-sm flex-1 cursor-pointer">{table.name}</span>
                              </div>
                              {isTableExpanded && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    className="pl-5 border-l border-border-light dark:border-border-dark ml-3 overflow-hidden">
                                  {table.columns.map(column => (
                                    <div key={column.name} className="flex items-center p-1">
                                      <Minus className="w-3 h-3 text-slate-400 dark:text-slate-600 mr-2" />
                                      <span className="text-sm">{column.name}</span>
                                      <span className="text-xs text-text-muted-light dark:text-text-muted-dark ml-auto">{column.type}</span>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* --- NEW AI WARNING SECTION --- */}
        <div className="p-3 mt-auto border-t border-border-light dark:border-border-dark">
            <div className="flex items-start space-x-2 rounded-lg">
                <p className="text-2xs text-gray-500 dark:text-gray-500">
                    AI-generated queries may be imperfect. Always review the generated SQL before executing it on production databases.
                </p>
            </div>
        </div>
        {/* <div className="p-3 mt-auto border-t border-border-light dark:border-border-dark">
            <div className="flex items-start space-x-2 bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-500/40 dark:border-yellow-300/20 p-2.5 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-2xs text-yellow-800 dark:text-yellow-300">
                    AI-generated queries may be imperfect. Always review the generated SQL before executing it on production databases.
                </p>
            </div>
        </div> */}

        <div className="p-3 border-t border-border-light dark:border-border-dark space-y-3">
          <div className="text-xs text-text-muted-light dark:text-text-muted-dark flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${selectedDb ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span>{selectedDb ? `Connected to: ${selectedDb}` : 'No active connection'}</span>
          </div>
          <div className="flex items-center justify-between">
            <ThemeSwitcher />
            <button
              onClick={onLogout}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted-light dark:text-text-muted-dark"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
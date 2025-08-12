import { History, Save, Table, SlidersHorizontal, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCommandPalette } from '../components/command/CommandPalette';
import DataTable from '../components/DataTable';
import ERDiagram from '../components/ERDiagram';
import NLInput from '../components/NLPinput';
import SQLDisplay from '../components/SQLDisplay';
import { useConfirm } from '../contexts/ConfirmationContext';
import { usePrompt } from '../contexts/InputContext';
import * as api from '../services/apiServices';
import { useAppStore } from '../store/useAppStore';

const EmptyResultsPlaceholder = () => ( <div className="bg-fg-light dark:bg-fg-dark rounded-lg p-8 text-center border border-border-light dark:border-border-dark"><Table className="w-12 h-12 text-text-muted-light dark:text-text-muted-dark mx-auto mb-4" /><h3 className="text-base font-semibold mb-1">No Data Available</h3><p className="text-sm text-text-muted-light dark:text-text-muted-dark">Your query ran successfully but returned no rows.</p></div>);

const Query = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prompt = usePrompt();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { selectedDb, mermaidString, fetchSchemaAndDiagram } = useAppStore();
  const { setActions } = useCommandPalette();

  const [currentSQL, setCurrentSQL] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'destructive', 'error'

  const { data: queryHistory = [] } = useQuery({ queryKey: ['history'], queryFn: api.getQueryHistory });
  const { data: savedQueries = [] } = useQuery({ queryKey: ['savedQueries'], queryFn: api.getSavedQueries });

  const handleCommand = useCallback(async (command, isSqlOnly = false) => {
      if (!selectedDb) { toast.error("No database selected."); return; }
      setIsLoading(true); 
      setError(''); 
      setQueryResult(null); 
      if (!isSqlOnly) {
        setCurrentSQL('');
      }
      try {
          const result = await api.executeCommand(command, selectedDb);
          console.log(result);
          if (!isSqlOnly) setCurrentSQL(result.sql_query || '');
          if (result.result && result.result.data) {
              setQueryResult({ data: result.result.data });
              toast.success(`Query successful, ${result.result.data.length} rows returned.`);
          } else { setQueryResult({ data: [] }); toast.success('Query executed successfully.'); }
          queryClient.invalidateQueries(['history']); // Refetch history
      } catch (err) {
          const errorMessage = err.response?.data?.detail || err.message || 'An unknown error occurred.';
          setError(errorMessage);
          toast.error(errorMessage);
          queryClient.invalidateQueries({ queryKey: ['history'] });
      } finally { setIsLoading(false); }
  }, [selectedDb, queryClient]);

  const handleNLCommand = (command) => handleCommand(command, false);

  const handleRunSQL = async (sql) => {
    const destructiveKeywords = ['DELETE', 'UPDATE', 'DROP', 'TRUNCATE', 'ALTER'];
    const isDestructive = destructiveKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(sql));
    if (isDestructive) {
        const wasConfirmed = await confirm({ title: "Destructive Query Warning", message: "You are about to run a query that may alter or delete data. This action is permanent.", confirmText: "Yes, run query", isDestructive: true, icon: 'warning' });
        if (!wasConfirmed) { toast.error("Execution cancelled."); return; }
    }
    handleCommand(sql, true);
  };
  
  useEffect(() => {
      if (location.state?.autoQuery) {
          const { autoQuery, replaceEditor } = location.state;
          if (replaceEditor || !currentSQL) {
              setCurrentSQL(autoQuery);
          }
          handleRunSQL(autoQuery);
          navigate(location.pathname, { replace: true, state: {} });
      }
  }, [location.state, navigate, currentSQL]);
  
  const handleSaveQuery = async (sqlToSave) => {
    const name = await prompt({ title: "Save Query", message: "Enter a descriptive name for this SQL query.", initialValue: "My Saved Query", confirmText: "Save Query" });
    if (name && sqlToSave) {
      await api.saveQuery(name, sqlToSave);
      toast.success(`Query "${name}" saved!`);
      queryClient.invalidateQueries(['savedQueries']);
    }
  };

  const loadQueryIntoEditor = async (sqlToLoad) => {
    if (currentSQL && currentSQL.trim() !== sqlToLoad.trim()) {
        const wasConfirmed = await confirm({ title: "Overwrite SQL Editor?", message: "This will replace the current content of the SQL editor.", confirmText: "Overwrite", isDestructive: false, icon: 'info' });
        if (!wasConfirmed) return;
    }
    setCurrentSQL(sqlToLoad);
  }

  useEffect(() => {
    if (currentSQL) {
        setActions(prev => [ ...prev.filter(a => a.id !== 'save_current_query'), { id: 'save_current_query', title: 'Action: Save Current SQL Query', onSelect: () => handleSaveQuery(currentSQL) }]);
    }
    return () => setActions(prev => prev.filter(a => a.id !== 'save_current_query'));
  }, [currentSQL, setActions]);

  const filteredHistory = useMemo(() => {
    const destructiveRegex = /\b(DELETE|UPDATE|DROP|TRUNCATE|ALTER)\b/i;
    return queryHistory
        .filter(h => {
            if (historyFilter === 'destructive') return destructiveRegex.test(h.generated_sql);
            // In a real app, an 'error' flag would come from the backend. We'll simulate.
            if (historyFilter === 'error') return h.natural_language_query?.toLowerCase().includes('error');
            return true;
        })
        .filter(h => h.generated_sql.toLowerCase().includes(historySearch.toLowerCase()));
  }, [queryHistory, historySearch, historyFilter]);

  const FilterButton = ({ value, label }) => (
    <button onClick={() => setHistoryFilter(value)} className={`px-2 py-0.5 text-xs rounded-full ${historyFilter === value ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{label}</button>
  );

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <NLInput onExecute={handleNLCommand} isLoading={isLoading} />
        {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-md border border-red-500/20"><strong>Query Error:</strong> {error}</div>}
        {currentSQL && <SQLDisplay sql={currentSQL} setSql={setCurrentSQL} onExecuteSql={handleRunSQL} selectedDb={selectedDb} onSaveQuery={handleSaveQuery}/>}
        {queryResult && queryResult.data.length > 0 && <DataTable table={queryResult} />}
        {queryResult && queryResult.data.length === 0 && !error && <EmptyResultsPlaceholder />}
        <ERDiagram mermaidString={mermaidString} onRefresh={() => fetchSchemaAndDiagram(selectedDb)} />
      </div>
      
      <div className="space-y-4">
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center space-x-2"><History className="w-4 h-4 text-blue-500" /><span>Query History</span></h3>
            <input type="search" placeholder="Search history..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="w-full text-xs bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md px-2 py-1 mb-2"/>
            <div className="flex items-center space-x-2 mb-2"><FilterButton value="all" label="All" /><FilterButton value="destructive" label="Destructive" /></div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredHistory.map((item) => (
                    <motion.div key={item.id} initial={{opacity: 0}} animate={{opacity: 1}} className="bg-bg-light dark:bg-bg-dark rounded p-2 border border-border-light dark:border-border-dark group">
                        <p className="text-xs font-mono truncate cursor-pointer" onClick={() => loadQueryIntoEditor(item.generated_sql)}>{item.generated_sql}</p>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-2xs text-text-muted-light dark:text-text-muted-dark">{new Date(item.executed_at).toLocaleString()}</span>
                            <motion.button whileTap={{scale:0.9}} onClick={() => handleSaveQuery(item.generated_sql)} className="opacity-0 group-hover:opacity-100"><Save className="w-3.5 h-3.5 transition-all text-blue-400"/></motion.button>
                        </div>
                    </motion.div>
                ))}
                {filteredHistory.length === 0 && <p className="text-xs text-center text-text-muted-light dark:text-text-muted-dark py-4">No history matching criteria.</p>}
            </div>
        </div>
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center space-x-2"><Save className="w-4 h-4 text-blue-500" /><span>Saved Queries</span></h3>
              <button onClick={() => navigate('/saved-queries')} className="text-xs font-medium text-blue-500 hover:underline">View All</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedQueries.slice(0, 5).map((query) => (
                    <div key={query.id} onClick={() => loadQueryIntoEditor(query.query)} className="bg-bg-light dark:bg-bg-dark rounded p-2 border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <p className="text-xs font-medium">{query.name}</p>
                        <p className="text-2xs font-mono mt-1 truncate text-text-muted-light dark:text-text-muted-dark">{query.query}</p>
                    </div>
                ))}
                 {savedQueries.length === 0 && <p className="text-xs text-center text-text-muted-light dark:text-text-muted-dark py-4">No saved queries yet.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Query;
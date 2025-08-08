import { History, Save, Table } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCommandPalette } from '../components/command/CommandPalette';
import DataTable from '../components/DataTable';
import ERDiagram from '../components/ERDiagram';
import NLInput from '../components/NLPinput';
import SQLDisplay from '../components/SQLDisplay';
import { useConfirm } from '../contexts/ConfirmationContext'; // --- IMPORT THE CONFIRM HOOK ---
import { usePrompt } from '../contexts/InputContext';
import * as api from '../services/apiServices';
import { useAppStore } from '../store/useAppStore';

const EmptyResultsPlaceholder = () => (
    <div className="bg-fg-light dark:bg-fg-dark rounded-lg p-8 text-center border border-border-light dark:border-border-dark">
        <Table className="w-12 h-12 text-text-muted-light dark:text-text-muted-dark mx-auto mb-4" />
        <h3 className="text-base font-semibold mb-1">No Data Available</h3>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Your query ran successfully but returned no rows.</p>
    </div>
);

const Query = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prompt = usePrompt();
  const confirm = useConfirm(); // --- GET THE CONFIRM FUNCTION ---

  const { selectedDb, mermaidString, fetchSchemaAndDiagram } = useAppStore();
  const { setActions } = useCommandPalette();

  const [currentSQL, setCurrentSQL] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [queryHistory, setQueryHistory] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  
  const handleCommand = useCallback(async (command, isSqlOnly = false) => {
      if (!selectedDb) {
          setError("No database selected. Please connect to a database from the sidebar.");
          toast.error("No database selected.");
          return;
      }
      setIsLoading(true);
      setError('');
      setQueryResult(null);
      try {
          const result = await api.executeCommand(command, selectedDb);
          if (!isSqlOnly) setCurrentSQL(result.sql_query || '');
          if (result.result && result.result.data) {
              setQueryResult({ data: result.result.data });
              toast.success(`Query successful, ${result.result.data.length} rows returned.`);
          } else {
              setQueryResult({ data: [] }); 
              toast.success('Query executed successfully.');
          }
      } catch (err) {
          const errorMessage = err.response?.data?.detail || err.message || 'An unknown error occurred.';
          setError(errorMessage);
          toast.error(errorMessage);
      } finally {
          setIsLoading(false);
      }
  }, [selectedDb]);

  const handleNLCommand = (command) => handleCommand(command, false);

  // --- REFACTORED TO INCLUDE CONFIRMATION ---
  const handleRunSQL = async (sql) => {
    const destructiveKeywords = ['DELETE', 'UPDATE', 'DROP', 'TRUNCATE', 'ALTER'];
    // Use a regex for whole-word matching, case-insensitive
    const isDestructive = destructiveKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(sql));

    if (isDestructive) {
        const wasConfirmed = await confirm({
            title: "Destructive Query Warning",
            message: "You are about to run a query that may alter or delete data. This action is permanent. Are you sure you want to proceed?",
            confirmText: "Yes, run query",
            isDestructive: true, // This will use the red button theme
            icon: 'warning'
        });

        if (!wasConfirmed) {
            toast.error("Execution cancelled.");
            return; // Stop if the user cancels
        }
    }
    
    handleCommand(sql, true);
  };
  
  const fetchHistoryAndSaved = useCallback(async () => {
    try {
        setQueryHistory(await api.getQueryHistory());
        setSavedQueries(await api.getSavedQueries());
    } catch (err) {
        console.error("Failed to fetch history/saved queries:", err);
    }
  }, []);

  useEffect(() => {
      fetchHistoryAndSaved();
  }, [queryResult, fetchHistoryAndSaved]);

  useEffect(() => {
      if (location.state?.autoQuery) {
          const queryToRun = location.state.autoQuery;
          setCurrentSQL(queryToRun);
          handleRunSQL(queryToRun);
          navigate(location.pathname, { replace: true, state: {} });
      }
  }, [location.state, navigate]);
  
  const handleSaveQuery = async (sqlToSave) => {
    const name = await prompt({
        title: "Save Query",
        message: "Enter a descriptive name for this SQL query.",
        initialValue: "My Saved Query",
        confirmText: "Save Query"
    });

    if (name && sqlToSave) {
      await api.saveQuery(name, sqlToSave);
      toast.success(`Query "${name}" saved!`);
      fetchHistoryAndSaved();
    }
  };

  // --- NEW FUNCTION TO HANDLE LOADING QUERIES INTO THE EDITOR ---
  const loadQueryIntoEditor = async (sqlToLoad) => {
    // Check if there is text in the editor that is different from the text to be loaded
    if (currentSQL && currentSQL.trim() !== sqlToLoad.trim()) {
        const wasConfirmed = await confirm({
            title: "Overwrite SQL Editor?",
            message: "This will replace the current content of the SQL editor. Your changes will be lost.",
            confirmText: "Overwrite",
            isDestructive: false,
            icon: 'info'
        });
        if (!wasConfirmed) return; // If user cancels, do nothing
    }
    setCurrentSQL(sqlToLoad);
  }

  useEffect(() => {
    if (currentSQL) {
        setActions(prevActions => [
            ...prevActions,
            { id: 'save_current_query', title: 'Action: Save Current SQL Query', onSelect: () => handleSaveQuery(currentSQL) },
        ]);
    }
    return () => {
        setActions(prev => prev.filter(a => a.id !== 'save_current_query'));
    }
  }, [currentSQL, setActions]);

  const filteredHistory = queryHistory.filter(h => h.generated_sql.toLowerCase().includes(historySearch.toLowerCase()));

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <NLInput onExecute={handleNLCommand} isLoading={isLoading} />
        
        {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-md border border-red-500/20"><strong>Query Error:</strong> {error}</div>}

        {currentSQL && 
            <SQLDisplay 
                sql={currentSQL} 
                setSql={setCurrentSQL} 
                onExecuteSql={handleRunSQL} 
                selectedDb={selectedDb} 
                onSaveQuery={handleSaveQuery}
            />
        }
        
        {queryResult && queryResult.data.length > 0 && <DataTable table={queryResult} />}
        {queryResult && queryResult.data.length === 0 && !error && <EmptyResultsPlaceholder />}

        <ERDiagram mermaidString={mermaidString} onRefresh={() => fetchSchemaAndDiagram(selectedDb)} />
      </div>
      
      <div className="space-y-4">
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2"><History className="w-4 h-4 text-orange-500" /><span>Query History</span></h3>
            <input type="search" placeholder="Search history..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="w-full text-xs bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md px-2 py-1 mb-2"/>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredHistory.map((item) => (
                    <div key={item.id} className="bg-bg-light dark:bg-bg-dark rounded p-2 border border-border-light dark:border-border-dark group">
                        <p className="text-xs font-mono truncate cursor-pointer" onClick={() => loadQueryIntoEditor(item.generated_sql)}>{item.generated_sql}</p>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-2xs text-text-muted-light dark:text-text-muted-dark">{new Date(item.executed_at).toLocaleString()}</span>
                            <button onClick={() => handleSaveQuery(item.generated_sql)} className="opacity-0 group-hover:opacity-100"><Save className="w-3 h-3 transition-all text-green-400"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2"><Save className="w-4 h-4 text-green-500" /><span>Saved Queries</span></h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedQueries.map((query) => (
                    <div key={query.id} onClick={() => loadQueryIntoEditor(query.query)} className="bg-bg-light dark:bg-bg-dark rounded p-2 border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <p className="text-xs font-medium">{query.name}</p>
                        <p className="text-2xs font-mono mt-1 truncate">{query.query}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Query;
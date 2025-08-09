import { ChevronsRight, Database, Edit, GitPullRequest, Loader, Plus, Trash2, ListTree, Eye, MessageSquare, X, FileCode } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/apiServices';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmationContext';
import { usePrompt } from '../contexts/InputContext';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../components/DataTable';

// The SchemaDiffModal component remains unchanged and is kept for the "Compare" feature
const SchemaDiffModal = ({ databases, selectedDb, onClose }) => {
    const [mode, setMode] = useState('database'); 
    const [isLoading, setIsLoading] = useState(false);
    const [diffResult, setDiffResult] = useState(null);
    const [dbSource, setDbSource] = useState(selectedDb);
    const [dbTarget, setDbTarget] = useState('');
    const [tblSourceDb, setTblSourceDb] = useState(selectedDb);
    const [tblTargetDb, setTblTargetDb] = useState(selectedDb);
    const [sourceTables, setSourceTables] = useState([]);
    const [targetTables, setTargetTables] = useState([]);
    const [tblSource, setTblSource] = useState('');
    const [tblTarget, setTblTarget] = useState('');
    const [compareTypes, setCompareTypes] = useState(new Set(['schema']));

    useEffect(() => {
        if (mode === 'table' && tblSourceDb) api.listTables(tblSourceDb).then(setSourceTables);
    }, [mode, tblSourceDb]);
    
    useEffect(() => {
        if (mode === 'table' && tblTargetDb) api.listTables(tblTargetDb).then(setTargetTables);
    }, [mode, tblTargetDb]);

    const handleCompareTypeChange = (type) => {
        const newTypes = new Set(compareTypes);
        newTypes.has(type) ? newTypes.delete(type) : newTypes.add(type);
        setCompareTypes(newTypes);
    };

    const handleCompare = async () => {
        setIsLoading(true);
        setDiffResult(null);
        try {
            if (mode === 'database') {
                const result = await api.diffSchemas(dbSource, dbTarget);
                setDiffResult({ schema: result.migration_sql });
            } else {
                let schemaResult = null, dataResult = null;
                if (compareTypes.has('schema')) schemaResult = await api.diffTableSchemas(tblSourceDb, tblSource, tblTargetDb, tblTarget);
                if (compareTypes.has('data')) dataResult = await api.diffTableData(tblSourceDb, tblSource, tblTargetDb, tblTarget);
                setDiffResult({ schema: schemaResult?.migration_sql, data: dataResult });
            }
        } catch(err) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const isCompareDisabled = isLoading || (mode === 'database' && (!dbSource || !dbTarget)) || (mode === 'table' && (!tblSource || !tblTarget));

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-fg-light dark:bg-fg-dark rounded-lg w-full max-w-3xl p-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-semibold mb-4">Compare Schemas & Data</h3>
                <div className="flex items-center p-1 rounded-md bg-slate-100 dark:bg-slate-800 mb-4">
                    <button onClick={() => setMode('database')} className={`flex-1 text-sm p-1.5 rounded ${mode === 'database' ? 'bg-white dark:bg-slate-700' : ''}`}>Compare Databases</button>
                    <button onClick={() => setMode('table')} className={`flex-1 text-sm p-1.5 rounded ${mode === 'table' ? 'bg-white dark:bg-slate-700' : ''}`}>Compare Tables</button>
                </div>

                <div className="space-y-4">
                    {/* UI Content for the modal */}
                    {mode === 'database' ? (
                        <div className="flex items-end space-x-2">
                            <div className="flex-1"><label className="text-xs">Source DB</label><select value={dbSource} onChange={e => setDbSource(e.target.value)} className="w-full text-sm p-2 rounded-md border border-border-light dark:border-border-dark mt-1"><option value="">Select</option>{databases.map(db => <option key={db.id} value={db.virtual_name}>{db.virtual_name}</option>)}</select></div>
                            <ChevronsRight className="w-6 h-6 mb-2"/>
                            <div className="flex-1"><label className="text-xs">Target DB</label><select value={dbTarget} onChange={e => setDbTarget(e.target.value)} className="w-full text-sm p-2 rounded-md border border-border-light dark:border-border-dark mt-1"><option value="">Select</option>{databases.map(db => <option key={db.id} value={db.virtual_name}>{db.virtual_name}</option>)}</select></div>
                        </div>
                    ) : (
                         <div className="space-y-3">
                            <div className="flex items-end space-x-2">
                                <div className="flex-1"><label className="text-xs">Source</label><select value={tblSourceDb} onChange={e => setTblSourceDb(e.target.value)} className="w-full text-sm p-2 rounded-md border border-border-light dark:border-border-dark mt-1">{databases.map(db => <option key={db.id} value={db.virtual_name}>{db.virtual_name}</option>)}</select></div>
                                <div className="flex-1"><label className="text-xs">&nbsp;</label><select value={tblSource} onChange={e => setTblSource(e.target.value)} className="w-full text-sm p-2 rounded-md border border-border-light dark:border-border-dark mt-1"><option value="">Select Table</option>{sourceTables.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            </div>
                            <div className="flex items-end space-x-2">
                                <div className="flex-1"><label className="text-xs">Target</label><select value={tblTargetDb} onChange={e => setTblTargetDb(e.target.value)} className="w-full text-sm p-2 rounded-md border border-border-light dark:border-border-dark mt-1">{databases.map(db => <option key={db.id} value={db.virtual_name}>{db.virtual_name}</option>)}</select></div>
                                <div className="flex-1"><label className="text-xs">&nbsp;</label><select value={tblTarget} onChange={e => setTblTarget(e.target.value)} className="w-full text-sm p-2 rounded-md border border-border-light dark:border-border-dark mt-1"><option value="">Select Table</option>{targetTables.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            </div>
                            <div className="flex items-center space-x-4 pt-2">
                                <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={compareTypes.has('schema')} onChange={() => handleCompareTypeChange('schema')} className="rounded"/><span>Compare Schema</span></label>
                                <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={compareTypes.has('data')} onChange={() => handleCompareTypeChange('data')} className="rounded"/><span>Compare Data</span></label>
                            </div>
                        </div>
                    )}
                    <button onClick={handleCompare} disabled={isCompareDisabled} className="bg-blue-600 text-white p-2 rounded-md w-full disabled:opacity-50 flex items-center justify-center space-x-2">
                        {isLoading && <Loader className="w-4 h-4 animate-spin"/>}
                        <span>Compare</span>
                    </button>
                </div>

                {diffResult && (
                    <div className="mt-4 border-t border-border-light dark:border-border-dark pt-4">
                        <h4 className="font-semibold text-sm mb-2">Comparison Result</h4>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {diffResult.schema && <div><h5 className="font-semibold text-xs mb-1">Schema Migration SQL</h5><pre className="text-xs font-mono bg-bg-light dark:bg-bg-dark p-2 rounded-md border">{diffResult.schema}</pre></div>}
                            {diffResult.data?.inserts?.length > 0 && <div><h5 className="font-semibold text-xs mb-1">Data Inserts</h5><pre className="text-xs font-mono bg-bg-light dark:bg-bg-dark p-2 rounded-md border">{diffResult.data.inserts.join('\n')}</pre></div>}
                            {diffResult.data?.updates?.length > 0 && <div><h5 className="font-semibold text-xs mb-1">Data Updates</h5><pre className="text-xs font-mono bg-bg-light dark:bg-bg-dark p-2 rounded-md border">{diffResult.data.updates.join('\n')}</pre></div>}
                            {diffResult.data?.deletes?.length > 0 && <div><h5 className="font-semibold text-xs mb-1">Data Deletes</h5><pre className="text-xs font-mono bg-bg-light dark:bg-bg-dark p-2 rounded-md border">{diffResult.data.deletes.join('\n')}</pre></div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SchemaPage = ({ onTableDelete }) => {
  const { schema, selectedDb, fetchSchemaAndDiagram } = useAppStore();
  const [selectedTable, setSelectedTable] = useState(null);
  const [isDiffing, setIsDiffing] = useState(false);
  const [dbList, setDbList] = useState([]);
  const [annotations, setAnnotations] = useState({});
  
  // --- STATE FOR IN-PAGE DATA PREVIEW ---
  const [previewData, setPreviewData] = useState(null);
  const [previewTableName, setPreviewTableName] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const navigate = useNavigate();
  const confirm = useConfirm();
  const prompt = usePrompt();

  useEffect(() => {
    if (schema.tables.length > 0 && !selectedTable) {
      setSelectedTable(schema.tables[0]);
    } else if (schema.tables.length === 0) {
      setSelectedTable(null);
    }
  }, [schema.tables, selectedTable]);
  
  useEffect(() => {
    if (selectedDb && selectedTable) {
      const key = `fastdb_annotations_${selectedDb}_${selectedTable.name}`;
      const savedAnnotations = localStorage.getItem(key);
      setAnnotations(savedAnnotations ? JSON.parse(savedAnnotations) : {});
    }
  }, [selectedDb, selectedTable]);


  const handleStartDiff = async () => {
    setDbList(await api.listDatabases());
    setIsDiffing(true);
  };
  
  const confirmAndDelete = async (tableName) => {
    const wasConfirmed = await confirm({
        title: `Delete Table "${tableName}"?`,
        message: "This action is permanent and cannot be undone. All data in this table will be lost.",
        confirmText: "Yes, delete table",
    });

    if (wasConfirmed) {
        try {
            await onTableDelete(tableName);
            toast.success(`Table "${tableName}" deleted successfully.`);
            if(selectedTable?.name === tableName) setSelectedTable(null);
            if(previewTableName === tableName) setPreviewData(null); // Close preview if table is deleted
        } catch (err) {
            toast.error(`Failed to delete table: ${err.message}`);
        }
    }
  }

  // --- REFACTORED: FETCH DATA FOR IN-PAGE DISPLAY ---
  const handleViewData = async (tableName) => {
    setIsPreviewLoading(true);
    setPreviewData(null);
    setPreviewTableName(tableName);

    try {
      const result = await api.executeCommand(`SELECT * FROM "${tableName}" LIMIT 100;`, selectedDb);
      if (result.result && result.result.data) {
        setPreviewData(result.result.data);
      } else {
        setPreviewData([]);
      }
    } catch (err) {
      toast.error(`Failed to fetch data: ${err.message}`);
      setPreviewData(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };
  
  const handleTruncate = async (tableName) => {
    const wasConfirmed = await confirm({
        title: `Truncate Table "${tableName}"?`,
        message: "This will delete all data from the table. This action cannot be undone.",
        confirmText: "Yes, truncate table",
        isDestructive: true,
    });
    if (wasConfirmed) {
        try {
            await api.executeCommand(`TRUNCATE TABLE "${tableName}"`, selectedDb);
            toast.success("Table truncated successfully.");
            fetchSchemaAndDiagram(selectedDb);
        } catch (err) {
            toast.error(`Truncate failed: ${err.message}`);
        }
    }
  };

  const handleEditAnnotation = async (columnName) => {
    const currentAnnotation = annotations[columnName] || '';
    const newAnnotation = await prompt({
        title: `Edit Description for "${columnName}"`,
        message: "Add a human-readable description for this column. This is stored in your browser.",
        initialValue: currentAnnotation,
        confirmText: "Save Description",
    });

    if (newAnnotation !== null) {
      const key = `fastdb_annotations_${selectedDb}_${selectedTable.name}`;
      const newAnnotations = { ...annotations, [columnName]: newAnnotation };
      setAnnotations(newAnnotations);
      localStorage.setItem(key, JSON.stringify(newAnnotations));
      toast.success("Description saved!");
    }
  };

  return (
    <div className="space-y-4">
      {isDiffing && <SchemaDiffModal databases={dbList} selectedDb={useAppStore.getState().selectedDb} onClose={() => setIsDiffing(false)}/>}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Database Schema</h2>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Manage and compare your database structure</p>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={() => navigate('/schema/builder')} className="border border-border-light dark:border-border-dark text-sm font-medium px-3 py-1.5 rounded-md flex items-center space-x-2"><FileCode className="w-4 h-4" /><span>Builder</span></button>
            <button onClick={handleStartDiff} className="border border-border-light dark:border-border-dark text-sm font-medium px-3 py-1.5 rounded-md flex items-center space-x-2"><GitPullRequest className="w-4 h-4" /><span>Compare</span></button>
            <button onClick={() => navigate('/table/new')} className="bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md flex items-center space-x-2"><Plus className="w-4 h-4" /><span>New Table</span></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-3">Tables ({schema.tables.length})</h3>
            <div className="space-y-1">
              {schema.tables.map((table) => (
                <div key={table.id} onClick={() => setSelectedTable(table)}
                  className={`p-2 rounded-md cursor-pointer flex items-center justify-between group ${selectedTable?.id === table.id ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <div><p className="text-sm font-medium">{table.name}</p><p className="text-xs">{table.rowCount.toLocaleString()} rows</p></div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/table/edit/${table.name}`); }} className="p-1.5"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); confirmAndDelete(table.name); }} className="p-1.5 text-red-500/70 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
        </div>
        <div className="lg:col-span-2">
          {selectedTable ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-base font-semibold mb-1">{selectedTable.name}</h3>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{selectedTable.rowCount.toLocaleString()} Rows</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleViewData(selectedTable.name)} className="text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-1 rounded-md flex items-center space-x-1.5"><Eye className="w-3.5 h-3.5"/><span>View Data</span></button>
                        <button onClick={() => handleTruncate(selectedTable.name)} className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 px-2 py-1 rounded-md flex items-center space-x-1.5"><Trash2 className="w-3.5 h-3.5"/><span>Truncate</span></button>
                    </div>
                </div>
              </div>

              <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                <h4 className="text-xs font-semibold uppercase mb-2">Columns</h4>
                <div className="space-y-1">
                  {selectedTable.columns.map((column, idx) => (
                    <div key={idx} className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md p-3 group">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium">{column.name}</span>
                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{column.type}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleEditAnnotation(column.name)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1"><MessageSquare className="w-3.5 h-3.5 text-text-muted-light dark:text-text-muted-dark" /></button>
                                {column.primary_key && <span className="text-2xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">PK</span>}
                                {!column.nullable && <span className="text-2xs font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">NOT NULL</span>}
                            </div>
                        </div>
                        {annotations[column.name] && (
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-2 pl-1 border-l-2 border-blue-500/50 ml-px">
                                {annotations[column.name]}
                            </p>
                        )}
                    </div>
                  ))}
                </div>
              </div>
              
              {schema.indexes.filter(idx => idx.table_name === selectedTable.name).length > 0 && (
                <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                    <h4 className="text-xs font-semibold uppercase mb-2">Indexes</h4>
                    <div className="space-y-1">
                        {schema.indexes.filter(idx => idx.table_name === selectedTable.name).map(index => (
                             <div key={index.name} className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md p-3 flex items-center space-x-3">
                                <ListTree className="w-4 h-4 text-orange-500" />
                                <div>
                                    <p className="text-sm font-medium">{index.name}</p>
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-mono">{index.definition}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-fg-light dark:bg-fg-dark border rounded-lg p-12 text-center h-full flex flex-col justify-center">
              <Database className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-base font-semibold">Select a Table</h3>
              <p className="text-sm">Choose a table to view its structure or create a new one.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* --- NEW IN-PAGE DATA PREVIEW SECTION --- */}
      <AnimatePresence>
        {(isPreviewLoading || previewData) && (
          <motion.div
            key="preview-panel"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            {isPreviewLoading ? (
                <div className="bg-fg-light dark:bg-fg-dark rounded-lg border border-border-light dark:border-border-dark h-[50vh] flex items-center justify-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                previewData && (
                    <div className="h-[50vh] flex flex-col">
                        <div className="flex items-center justify-between p-3 border border-border-light dark:border-border-dark bg-fg-light dark:bg-fg-dark rounded-lg mb-4">
                             <h3 className="font-semibold text-sm text-text-light dark:text-text-dark">
                                Preview: <span className="font-medium text-blue-500">{previewTableName}</span>
                            </h3>
                            <button onClick={() => setPreviewData(null)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* 
                          We remove the DataTable's default border/rounding and let this container handle it,
                          but since we cannot modify the DataTable component, this is a visual compromise.
                          The best approach is a wrapper with a header.
                        */}
                        <DataTable table={{ data: previewData }} title={`Top 100 Rows`} />
                    </div>
                )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchemaPage;
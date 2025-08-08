import { Plus, Save, Trash2, AlertTriangle, Key } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/apiServices';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmationContext';

const WarningBox = ({ children }) => (
    <div className="border text-xs p-3 rounded-lg my-4 
        bg-yellow-100 border-yellow-300 text-yellow-800 
        dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-300">
        <div className="flex">
            <AlertTriangle className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">{children}</div>
        </div>
    </div>
);

const EditTable = ({ onSaveSuccess, onCancel }) => {
    const { tableName: initialTableName } = useParams();
    const navigate = useNavigate();
    const originalState = useRef(null);
    const { schema, selectedDb } = useAppStore();
    const tables = schema.tables;
    const confirm = useConfirm();

    const [tableName, setTableName] = useState(initialTableName);
    const [columns, setColumns] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const dataTypes = [
        'TEXT', 'VARCHAR(255)', 'INTEGER', 'BIGINT', 'SERIAL', 'BIGSERIAL',
        'BOOLEAN', 'REAL', 'NUMERIC', 'DATE', 'TIMESTAMP', 'TIMESTAMP WITH TIME ZONE',
        'JSON', 'JSONB', 'UUID', 'BLOB'
    ];

    useEffect(() => {
        const tableToEdit = tables.find(t => t.name === initialTableName);
        if (tableToEdit) {
            const loadedColumns = tableToEdit.columns.map(col => ({
                id: Math.random(), originalName: col.name, name: col.name, type: col.type,
                defaultValue: col.default_value, primaryKey: col.primary_key, nullable: col.nullable, isNew: false,
            }));
            setColumns(loadedColumns);
            originalState.current = { tableName: initialTableName, columns: JSON.parse(JSON.stringify(loadedColumns)) };
        } else {
            if (tables.length > 0) {
                toast.error(`Table "${initialTableName}" not found.`);
                navigate('/schema');
            }
        }
    }, [initialTableName, tables, navigate]);

    const addColumn = () => setColumns([...columns, { id: Math.random(), name: '', type: 'TEXT', defaultValue: null, primaryKey: false, nullable: true, isNew: true }]);
    const removeColumn = (id) => setColumns(columns.filter(c => c.id !== id));

    const updateColumn = (id, field, value) => {
        setColumns(currentColumns => currentColumns.map(c => {
            if (c.id === id) {
                const updatedCol = { ...c, [field]: value };
                if (field === 'primaryKey' && value) updatedCol.nullable = false;
                return updatedCol;
            }
            if (field === 'primaryKey' && value) return { ...c, primaryKey: false };
            return c;
        }));
    };

    const handleSave = async () => {
        const sqlCommands = [];
        const original = originalState.current;
        if (!original) return;

        const currentTableName = tableName;

        if (original.tableName !== currentTableName) {
            sqlCommands.push(`ALTER TABLE "${original.tableName}" RENAME TO "${currentTableName}";`);
        }
        
        original.columns.forEach(origCol => {
            if (!columns.some(c => c.originalName === origCol.originalName)) {
                sqlCommands.push(`ALTER TABLE "${currentTableName}" DROP COLUMN "${origCol.originalName}";`);
            }
        });

        columns.forEach(col => {
            if (col.isNew) {
                if (!col.name) return;
                let colDef = `"${col.name}" ${col.type}`;
                if (col.primaryKey) colDef += ' PRIMARY KEY';
                if (!col.nullable) colDef += ' NOT NULL';
                sqlCommands.push(`ALTER TABLE "${currentTableName}" ADD COLUMN ${colDef};`);
            } else {
                const origCol = original.columns.find(c => c.originalName === col.originalName);
                if (!origCol) return;
                if (origCol.name !== col.name) sqlCommands.push(`ALTER TABLE "${currentTableName}" RENAME COLUMN "${origCol.name}" TO "${col.name}";`);
                if (origCol.type !== col.type) sqlCommands.push(`ALTER TABLE "${currentTableName}" ALTER COLUMN "${col.name}" TYPE ${col.type} USING "${col.name}"::${col.type};`);
                if (origCol.nullable !== col.nullable) sqlCommands.push(`ALTER TABLE "${currentTableName}" ALTER COLUMN "${col.name}" ${col.nullable ? 'DROP NOT NULL' : 'SET NOT NULL'};`);
            }
        });

        if (sqlCommands.length === 0) {
            toast.success("No changes detected.");
            return;
        }

        const wasConfirmed = await confirm({
            title: "Apply Schema Changes?",
            message: "This will execute ALTER statements against your database and may be destructive. Please review your changes before confirming.",
            confirmText: "Apply Changes",
            isDestructive: false
        });

        if (!wasConfirmed) {
            return;
        }

        setIsSaving(true);
        try {
            const fullCommand = `BEGIN; ${sqlCommands.join('; ')} COMMIT;`;
            await api.executeCommand(fullCommand, selectedDb);
            toast.success(`Table "${currentTableName}" updated successfully!`);
            onSaveSuccess();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;
            toast.error(`Error updating table: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Edit Table: <span className="text-blue-500">{initialTableName}</span></h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Modify the table structure. Changes can be destructive.</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={onCancel} className="border border-border-light dark:border-border-dark bg-fg-light dark:bg-fg-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium px-3 py-1.5 rounded-md transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md flex items-center space-x-2 disabled:bg-blue-500/50">
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            <WarningBox>
                <p>Changing a column's data type may fail or result in **permanent data loss** if existing data cannot be converted.</p>
                <p>Renaming tables or columns may break applications or saved queries that depend on the old names.</p>
            </WarningBox>
            
            <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                <label className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1.5">Table Name</label>
                <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">Columns</h3>
                    <button onClick={addColumn} className="border border-border-light dark:border-border-dark bg-fg-light dark:bg-fg-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium px-3 py-1.5 rounded-md flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Add Column</span>
                    </button>
                </div>
                <div className="space-y-2">
                    {columns.map((column) => (
                        <div key={column.id} className="bg-bg-light dark:bg-bg-dark rounded-md p-3 border border-border-light dark:border-border-dark">
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-center">
                                <input type="text" value={column.name} onChange={(e) => updateColumn(column.id, 'name', e.target.value)} placeholder="Column name" className="md:col-span-3 bg-slate-100 dark:bg-slate-800 border-border-light dark:border-border-dark border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                                <select value={column.type} onChange={(e) => updateColumn(column.id, 'type', e.target.value)} className="md:col-span-2 bg-slate-100 dark:bg-slate-800 border-border-light dark:border-border-dark border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    {dataTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input type="text" value={column.defaultValue || ''} onChange={(e) => updateColumn(column.id, 'defaultValue', e.target.value)} placeholder="Default value" className="md:col-span-2 bg-slate-100 dark:bg-slate-800 border-border-light dark:border-border-dark border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                                <div className="md:col-span-4 flex items-center space-x-4">
                                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={column.primaryKey} onChange={e => updateColumn(column.id, 'primaryKey', e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500/50 bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"/>
                                        <span className="flex items-center space-x-1 text-xs"><Key className="w-3 h-3 text-blue-500" /><span>PK</span></span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={!column.nullable} onChange={e => updateColumn(column.id, 'nullable', !e.target.checked)} disabled={column.primaryKey} className="rounded text-blue-500 focus:ring-blue-500/50 bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 disabled:opacity-50"/>
                                        <span className="text-xs">Not Null</span>
                                    </label>
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    <button onClick={() => removeColumn(column.id)} className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-red-500 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EditTable;
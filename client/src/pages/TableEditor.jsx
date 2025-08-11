import { Key, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmationContext';
import { usePrompt } from '../contexts/InputContext';
import * as api from '../services/apiServices';
import { generateMockSql } from '../services/mockDataGenerator';
import { useAppStore } from '../store/useAppStore';


const TableEditor = ({ onSaveSuccess, onCancel }) => {
    const { selectedDb } = useAppStore();
    const confirm = useConfirm();
    const [tableName, setTableName] = useState('');
    const [columns, setColumns] = useState([
        { name: 'id', type: 'SERIAL', primaryKey: true, nullable: false },
        { name: '', type: 'TEXT', primaryKey: false, nullable: true }
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const prompt = usePrompt();
    const [mockSql, setMockSql] = useState('');
    const [isMockModalOpen, setIsMockModalOpen] = useState(false);


    const dataTypes = ['INTEGER', 'TEXT', 'REAL', 'BLOB', 'BOOLEAN', 'VARCHAR(255)', 'SERIAL', 'DATE', 'TIMESTAMP'];

    const addColumn = () => setColumns([...columns, { name: '', type: 'TEXT', primaryKey: false, nullable: true }]);
    const removeColumn = (index) => columns.length > 1 && setColumns(columns.filter((_, i) => i !== index));

    const updateColumn = (index, field, value) => {
        const newColumns = [...columns];
        const col = { ...newColumns[index], [field]: value };

        if (field === 'primaryKey' && value) {
            newColumns.forEach((c, i) => { if (i !== index) c.primaryKey = false; });
            col.nullable = false;
        }
        if (field === 'type' && col.type.toUpperCase() === 'SERIAL') {
            col.primaryKey = true;
            col.nullable = false;
        }
        newColumns[index] = col;
        setColumns(newColumns);
    };

    const handleSave = async () => {
        if (!tableName.trim()) {
            toast.error('Table name is required.'); // --- REPLACED ALERT ---
            return;
        }
        
        const validColumns = columns.filter(c => c.name.trim());
        if (validColumns.length === 0) {
            toast.error('At least one column is required.');
            return;
        }

        const wasConfirmed = await confirm({
            title: "Create New Table?",
            message: `This will execute a CREATE TABLE statement for "${tableName}" in the database "${selectedDb}".`,
            confirmText: "Create Table",
            isDestructive: false
        });

        if (!wasConfirmed) {
            return;
        }
        
        setIsSaving(true);
        const colsSQL = validColumns.map(c => {
                let colStr = `"${c.name}" ${c.type}`;
                if (c.primaryKey) colStr += ' PRIMARY KEY';
                if (!c.nullable) colStr += ' NOT NULL';
                return colStr;
            }).join(',\n');
        
        const sql = `CREATE TABLE "${tableName}" (\n${colsSQL}\n);`;

        try {
            await api.executeCommand(sql, selectedDb);
            toast.success(`Table "${tableName}" created successfully!`);
            onSaveSuccess();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;
            toast.error(`Error creating table: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateMockData = async () => {
        const rowCountStr = await prompt({
            title: "Generate Mock Data",
            message: "How many rows of mock data do you want to generate?",
            initialValue: "10",
            confirmText: "Generate"
        });
        const rowCount = parseInt(rowCountStr, 10);
        if (rowCount > 0) {
            const sql = generateMockSql(tableName, columns, rowCount);
            setMockSql(sql);
            setIsMockModalOpen(true);
        }
    };
    
    const MockDataModal = () => (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setIsMockModalOpen(false)}>
            <div className="bg-fg-light dark:bg-fg-dark rounded-lg w-full max-w-2xl p-4 flex flex-col h-2/3" onClick={e => e.stopPropagation()}>
                <h3 className="font-semibold mb-2">Generated Mock Data SQL</h3>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-2">Copy this SQL and run it on the Query page.</p>
                <textarea readOnly value={mockSql} className="flex-1 w-full bg-bg-light dark:bg-bg-dark font-mono text-xs p-2 border rounded-md"></textarea>
                <button onClick={() => setIsMockModalOpen(false)} className="mt-2 bg-blue-600 text-white py-2 rounded-md">Close</button>
            </div>
        </div>
    );

    
    return (
        <div className="space-y-4">
            {isMockModalOpen && <MockDataModal />}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-medium">Create New Table</h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Define the structure for your new table.</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={onCancel} className="border border-border-light dark:border-border-dark bg-fg-light dark:bg-fg-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium px-3 py-1.5 rounded-md transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md flex items-center space-x-2 disabled:bg-blue-500/50">
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving...' : 'Save Table'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                <label className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1.5">Table Name</label>
                <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="e.g., users"
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
                    {columns.map((column, index) => (
                        <div key={index} className="bg-bg-light dark:bg-bg-dark rounded-md p-3 border border-border-light dark:border-border-dark">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-center">
                                <input type="text" value={column.name} onChange={(e) => updateColumn(index, 'name', e.target.value)} placeholder="Column name" className="md:col-span-4 bg-slate-100 dark:bg-slate-800 border-border-light dark:border-border-dark border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                                <select value={column.type} onChange={(e) => updateColumn(index, 'type', e.target.value)} className="md:col-span-3 bg-slate-100 dark:bg-slate-800 border-border-light dark:border-border-dark border rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    {dataTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                
                                <div className="md:col-span-4 flex items-center space-x-4">
                                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={column.primaryKey} onChange={(e) => updateColumn(index, 'primaryKey', e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500/50 bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"/>
                                        <span className="flex items-center space-x-1 text-xs"><Key className="w-3 h-3 text-yellow-500" /><span>PK</span></span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={!column.nullable} onChange={(e) => updateColumn(index, 'nullable', !e.target.checked)} disabled={column.primaryKey} className="rounded text-blue-500 focus:ring-blue-500/50 bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 disabled:opacity-50"/>
                                        <span className="text-xs">Not Null</span>
                                    </label>
                                </div>
                                
                                <div className="md:col-span-1 flex justify-end">
                                    <button onClick={() => removeColumn(index)} disabled={columns.length === 1} className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-red-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TableEditor;
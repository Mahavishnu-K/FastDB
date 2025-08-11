import { Check, Copy, FileCode, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SchemaBuilder = () => {
    const navigate = useNavigate();
    const [tableName, setTableName] = useState('');
    const [columns, setColumns] = useState([
        { id: 1, name: 'id', type: 'SERIAL', primaryKey: true, nullable: false },
        { id: 2, name: '', type: 'TEXT', primaryKey: false, nullable: true }
    ]);
    const [generatedSql, setGeneratedSql] = useState('');
    const [copied, setCopied] = useState(false);

    const dataTypes = ['TEXT', 'VARCHAR(255)', 'INTEGER', 'BIGINT', 'SERIAL', 'BIGSERIAL', 'BOOLEAN', 'REAL', 'NUMERIC', 'DATE', 'TIMESTAMP', 'JSON', 'JSONB', 'UUID'];

    const addColumn = () => setColumns([...columns, { id: Date.now(), name: '', type: 'TEXT', primaryKey: false, nullable: true }]);
    const removeColumn = (id) => columns.length > 1 && setColumns(columns.filter(c => c.id !== id));

    const updateColumn = (id, field, value) => {
        setColumns(currentCols => currentCols.map(c => {
            if (c.id === id) {
                const updated = { ...c, [field]: value };
                if (field === 'primaryKey' && value) updated.nullable = false;
                return updated;
            }
            // Ensure only one primary key
            if (field === 'primaryKey' && value) return { ...c, primaryKey: false };
            return c;
        }));
    };

    const handleGenerateSql = () => {
        if (!tableName.trim()) {
            toast.error('Table name is required.');
            return;
        }
        const validColumns = columns.filter(c => c.name.trim() && c.type.trim());
        if (validColumns.length === 0) {
            toast.error('At least one valid column is required.');
            return;
        }

        const colsSQL = validColumns.map(c => {
            let colStr = `    "${c.name}" ${c.type}`;
            if (c.primaryKey) colStr += ' PRIMARY KEY';
            if (!c.nullable) colStr += ' NOT NULL';
            return colStr;
        }).join(',\n');
        
        const sql = `CREATE TABLE "${tableName}" (\n${colsSQL}\n);`;
        setGeneratedSql(sql);
        toast.success("SQL generated!");
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedSql);
        setCopied(true);
        toast.success("SQL copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-medium">Schema Builder</h2>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Visually design a table and generate the SQL.</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => navigate('/schema')} className="border border-border-light dark:border-border-dark text-sm font-medium px-3 py-1.5 rounded-md">Cancel</button>
                    <button onClick={handleGenerateSql} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md flex items-center space-x-2">
                        <FileCode className="w-4 h-4" />
                        <span>Generate SQL</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                        <label className="block text-xs font-medium mb-1.5">Table Name</label>
                        <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="e.g., products" className="w-full bg-bg-light dark:bg-bg-dark border rounded-md px-3 py-2 text-sm"/>
                    </div>
                    <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold">Columns</h3>
                            <button onClick={addColumn} className="border border-border-light dark:border-border-dark text-sm font-medium px-3 py-1.5 rounded-md flex items-center space-x-2">
                                <Plus className="w-4 h-4" /><span>Add Column</span>
                            </button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {columns.map((col) => (
                                <div key={col.id} className="bg-bg-light dark:bg-bg-dark rounded-md p-3 border">
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <input type="text" value={col.name} onChange={e => updateColumn(col.id, 'name', e.target.value)} placeholder="Name" className="col-span-4 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-sm"/>
                                        <select value={col.type} onChange={e => updateColumn(col.id, 'type', e.target.value)} className="col-span-3 bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-sm">
                                            {dataTypes.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                        <div className="col-span-4 flex items-center space-x-2">
                                            <label className="flex items-center space-x-1 text-xs cursor-pointer"><input type="checkbox" checked={col.primaryKey} onChange={e => updateColumn(col.id, 'primaryKey', e.target.checked)} className="rounded"/><span>PK</span></label>
                                            <label className="flex items-center space-x-1 text-xs cursor-pointer"><input type="checkbox" checked={!col.nullable} onChange={e => updateColumn(col.id, 'nullable', !e.target.checked)} disabled={col.primaryKey} className="rounded"/><span>Not Null</span></label>
                                        </div>
                                        <button onClick={() => removeColumn(col.id)} disabled={columns.length === 1} className="col-span-1 text-red-500 disabled:opacity-30"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-4 flex flex-col">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="text-base font-semibold">Generated SQL</h3>
                         {generatedSql && (
                            <button onClick={handleCopy} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                {copied ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}
                            </button>
                         )}
                     </div>
                     <textarea
                        readOnly
                        value={generatedSql}
                        placeholder="SQL will appear here..."
                        className="w-full flex-1 bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark p-3 rounded-md border border-border-light dark:border-border-dark text-xs font-mono resize-none"
                        />
                </div>
            </div>
        </div>
    );
};

export default SchemaBuilder;
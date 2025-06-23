import { ArrowLeft, Key, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import * as api from '../services/apiServices'; // Import the API service

const TableEditor = ({ selectedDb, onSaveSuccess, onCancel }) => {
    const [tableName, setTableName] = useState('');
    const [columns, setColumns] = useState([{
        name: 'id', type: 'INTEGER', primaryKey: true, nullable: false, autoIncrement: true
    }, {
        name: '', type: 'TEXT', primaryKey: false, nullable: true, autoIncrement: false
    }]);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const dataTypes = [
        'INTEGER', 'TEXT', 'REAL', 'BLOB', 'BOOLEAN',
        'VARCHAR(255)', 'SERIAL', 'DATE', 'TIMESTAMP'
    ];

    const generateSQLPreview = () => {
        if (!tableName.trim() || columns.every(c => !c.name.trim())) {
            return '-- Define table name and at least one column to see a preview.';
        }
        const colsSQL = columns
            .filter(col => col.name.trim())
            .map(col => {
                let colStr = `  "${col.name}" ${col.type}`;
                if (col.primaryKey) colStr += ' PRIMARY KEY';
                if (!col.nullable) colStr += ' NOT NULL';
                // Note: PostgreSQL uses SERIAL for auto-increment, not AUTOINCREMENT
                if (col.autoIncrement && col.type.toUpperCase() !== 'SERIAL') {
                    // Suggest using SERIAL instead
                }
                return colStr;
            }).join(',\n');
        return `CREATE TABLE "${tableName}" (\n${colsSQL}\n);`;
    };

    const addColumn = () => {
        setColumns([...columns, { name: '', type: 'TEXT', primaryKey: false, nullable: true, autoIncrement: false }]);
    };

    const removeColumn = (index) => {
        if (columns.length > 1) setColumns(columns.filter((_, i) => i !== index));
    };

    const updateColumn = (index, field, value) => {
        const newColumns = [...columns];
        newColumns[index] = { ...newColumns[index], [field]: value };
        if (field === 'primaryKey' && value) {
            newColumns.forEach((col, i) => { if (i !== index) col.primaryKey = false; });
        }
        if (field === 'autoIncrement' && value) {
            newColumns[index].primaryKey = true;
            newColumns[index].type = 'SERIAL';
        }
        setColumns(newColumns);
    };

    const handleSave = async () => {
        // Simple validation
        if (!tableName.trim()) {
            alert('Table name is required.');
            return;
        }
        setIsSaving(true);
        const sql = generateSQLPreview();
        try {
            await api.executeSql(sql, selectedDb);
            alert('Table created successfully!');
            onSaveSuccess(); // This will trigger schema refresh and navigation
        } catch (err) {
            alert(`Error creating table: ${err.response?.data?.detail || err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // The rest of the JSX is mostly the same, just ensure props are used
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Create New Table</h2>
                    <p className="text-gray-400">Define your table structure and columns</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={onCancel} className="border border-gray-600 ...">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 ...">
                        {isSaving ? 'Saving...' : 'Save Table'}
                    </button>
                </div>
            </div>

        {/* Table Name */}
        <div className="bg-gray-950 border border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Table Information</h3>
            <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Table Name</label>
            <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Enter table name..."
                className={`w-full bg-gray-800 border ${errors.tableName ? 'border-red-500' : 'border-gray-600'} rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500`}
            />
            {errors.tableName && (
                <p className="text-red-400 text-sm mt-1">{errors.tableName}</p>
            )}
            </div>
        </div>

        {/* Columns */}
        <div className="bg-gray-950 border border-gray-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Columns</h3>
            <button 
                onClick={addColumn}
                className="border border-gray-600 hover:bg-gray-900 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
                <Plus className="w-4 h-4" />
                <span>Add Column</span>
            </button>
            </div>

            <div className="space-y-4">
            {columns.map((column, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Column Name */}
                    <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                    <input
                        type="text"
                        value={column.name}
                        onChange={(e) => updateColumn(index, 'name', e.target.value)}
                        placeholder="Column name"
                        className={`w-full bg-gray-700 border ${errors[`column_${index}_name`] ? 'border-red-500' : 'border-gray-600'} rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500`}
                    />
                    {errors[`column_${index}_name`] && (
                        <p className="text-red-400 text-xs mt-1">{errors[`column_${index}_name`]}</p>
                    )}
                    </div>

                    {/* Data Type */}
                    <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                    <select
                        value={column.type}
                        onChange={(e) => updateColumn(index, 'type', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                        {dataTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    </div>

                    {/* Constraints */}
                    <div className="md:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={column.primaryKey}
                            onChange={(e) => updateColumn(index, 'primaryKey', e.target.checked)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-300 flex items-center space-x-1">
                            <Key className="w-3 h-3 text-yellow-400" />
                            <span>Primary Key</span>
                        </span>
                        </label>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={!column.nullable}
                            onChange={(e) => updateColumn(index, 'nullable', !e.target.checked)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-300">Not Null</span>
                        </label>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={column.autoIncrement}
                            onChange={(e) => updateColumn(index, 'autoIncrement', e.target.checked)}
                            disabled={!column.primaryKey}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-300">Auto Inc.</span>
                        </label>
                    </div>
                    </div>

                    {/* Remove Button */}
                    <div className="md:col-span-1 flex justify-end">
                    <button
                        onClick={() => removeColumn(index)}
                        disabled={columns.length === 1}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                </div>
                </div>
            ))}
            </div>

            {columns.length === 0 && (
            <div className="text-center py-8">
                <p className="text-gray-500">No columns defined. Add at least one column.</p>
            </div>
            )}
        </div>

        {/* Preview */}
        {tableName && columns.some(col => col.name) && (
            <div className="bg-gray-950 border border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">SQL Preview</h3>
            <div className="bg-gray-900 rounded p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                <pre>{`CREATE TABLE ${tableName} (
    ${columns
    .filter(col => col.name)
    .map(col => 
        `  ${col.name} ${col.type}${
        col.primaryKey ? ' PRIMARY KEY' : ''
        }${
        col.autoIncrement ? ' AUTOINCREMENT' : ''
        }${
        !col.nullable ? ' NOT NULL' : ''
        }`
    ).join(',\n')}
    );`}</pre>
            </div>
            </div>
        )}
        </div>
    );
};

export default TableEditor;
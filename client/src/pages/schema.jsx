// pages/Schema.jsx
import React, { useState } from 'react';
import { Download, Share2, Plus, Edit3, Trash2, Key, Database, FileText } from 'lucide-react';

const Schema = ({ tables, setTables }) => {
  const [selectedTable, setSelectedTable] = useState(null);

  const handleExport = (format) => {
    const schemaData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      tables: tables.map(table => ({
        name: table.name,
        columns: table.columns.map(col => ({
          name: col.name,
          type: col.type,
          primaryKey: col.primaryKey || false,
          nullable: col.nullable !== false,
          autoIncrement: col.autoIncrement || false
        }))
      }))
    };

    const dataStr = format === 'json' 
      ? JSON.stringify(schemaData, null, 2)
      : generateSQL(schemaData);
    
    const dataBlob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.url = url;
    link.download = `schema.${format}`;
    link.click();
  };

  const generateSQL = (schema) => {
    return schema.tables.map(table => 
      `CREATE TABLE ${table.name} (\n${
        table.columns.map(col => 
          `  ${col.name} ${col.type}${
            col.primaryKey ? ' PRIMARY KEY' : ''
          }${
            col.autoIncrement ? ' AUTOINCREMENT' : ''
          }${
            !col.nullable ? ' NOT NULL' : ''
          }`
        ).join(',\n')
      }\n);`
    ).join('\n\n');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Database Schema</h2>
          <p className="text-gray-400">Manage your database structure and relationships</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => handleExport('json')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button 
            onClick={() => handleExport('sql')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Export SQL</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tables List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-400" />
                <span>Tables ({tables.length})</span>
              </h3>
              <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedTable?.id === table.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{table.name}</div>
                      <div className="text-sm opacity-75">
                        {table.columns.length} columns • {table.data.length} rows
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button className="p-1 hover:bg-gray-600 rounded">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button className="p-1 hover:bg-red-600 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Details */}
        <div className="lg:col-span-2">
          {selectedTable ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">{selectedTable.name}</h3>
                <div className="flex space-x-2">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                    Add Column
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                    Edit Table
                  </button>
                </div>
              </div>

              {/* Columns */}
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-white mb-3">Columns</h4>
                {selectedTable.columns.map((column, idx) => (
                  <div key={idx} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {column.primaryKey && <Key className="w-4 h-4 text-yellow-400" />}
                        <div>
                          <span className="text-white font-medium">{column.name}</span>
                          <span className="text-gray-400 text-sm ml-2">{column.type}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {column.primaryKey && (
                          <span className="bg-yellow-600 text-yellow-100 text-xs px-2 py-1 rounded">
                            PRIMARY KEY
                          </span>
                        )}
                        {!column.nullable && (
                          <span className="bg-red-600 text-red-100 text-xs px-2 py-1 rounded">
                            NOT NULL
                          </span>
                        )}
                        {column.autoIncrement && (
                          <span className="bg-blue-600 text-blue-100 text-xs px-2 py-1 rounded">
                            AUTO INCREMENT
                          </span>
                        )}
                        <button className="text-gray-400 hover:text-white">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Statistics */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{selectedTable.columns.length}</div>
                  <div className="text-gray-400 text-sm">Columns</div>
                </div>
                <div className="bg-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{selectedTable.data.length}</div>
                  <div className="text-gray-400 text-sm">Rows</div>
                </div>
                <div className="bg-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {selectedTable.columns.filter(col => col.primaryKey).length}
                  </div>
                  <div className="text-gray-400 text-sm">Primary Keys</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Table</h3>
              <p className="text-gray-500">Choose a table from the list to view its structure and details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schema;
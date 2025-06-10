// App.jsx
import React, { useState } from 'react';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Designer from './pages/designer';
import Query from './pages/query';
import Schema from './pages/schema';
import API from './pages/API';
import './App.css';

// Mock data
export const mockTables = [
  {
    id: 1,
    name: 'students',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'name', type: 'VARCHAR(100)', nullable: false },
      { name: 'age', type: 'INTEGER', nullable: false },
      { name: 'marks', type: 'DECIMAL(5,2)', nullable: true }
    ],
    data: [
      { id: 1, name: 'John Doe', age: 20, marks: 85.5 },
      { id: 2, name: 'Jane Smith', age: 22, marks: 92.0 },
      { id: 3, name: 'Bob Johnson', age: 21, marks: 78.5 }
    ]
  },
  {
    id: 2,
    name: 'products',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'name', type: 'VARCHAR(200)', nullable: false },
      { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
      { name: 'category', type: 'VARCHAR(100)', nullable: true }
    ],
    data: [
      { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
      { id: 2, name: 'Book', price: 15.99, category: 'Education' }
    ]
  }
];

// Natural Language Parser Utility
export const parseNaturalLanguage = (input) => {
  const lower = input.toLowerCase();
  
  if (lower.includes('create') && lower.includes('table')) {
    const tableName = lower.match(/table\s+(?:for\s+)?(\w+)/)?.[1] || 'new_table';
    return {
      type: 'CREATE_TABLE',
      sql: `CREATE TABLE ${tableName} (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name VARCHAR(100) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`,
      tableName
    };
  }
  
  if (lower.includes('select') || lower.includes('show') || lower.includes('get')) {
    const tableName = lower.match(/(?:from|show|get)\s+(\w+)/)?.[1] || 'students';
    return {
      type: 'SELECT',
      sql: `SELECT * FROM ${tableName};`,
      tableName
    };
  }
  
  if (lower.includes('insert') || lower.includes('add')) {
    const tableName = lower.match(/(?:into|to)\s+(\w+)/)?.[1] || 'students';
    return {
      type: 'INSERT',
      sql: `INSERT INTO ${tableName} (name, age, marks) VALUES ('New Student', 20, 85.0);`,
      tableName
    };
  }
  
  if (lower.includes('update') || lower.includes('modify')) {
    const tableName = lower.match(/update\s+(\w+)/)?.[1] || 'students';
    return {
      type: 'UPDATE',
      sql: `UPDATE ${tableName} SET name = 'Updated Name' WHERE id = 1;`,
      tableName
    };
  }
  
  if (lower.includes('delete') || lower.includes('remove')) {
    const tableName = lower.match(/(?:from|delete)\s+(\w+)/)?.[1] || 'students';
    return {
      type: 'DELETE',
      sql: `DELETE FROM ${tableName} WHERE id = 1;`,
      tableName
    };
  }
  
  return {
    type: 'UNKNOWN',
    sql: `-- Could not parse: ${input}\n-- Please try commands like:\n-- "Create a table for products"\n-- "Show all students"\n-- "Add a new student"\n-- "Update students set age = 21"\n-- "Delete from products where id = 1"`
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Designer');
  const [tables, setTables] = useState(mockTables);
  const [currentSQL, setCurrentSQL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setQueryResult(table);
    setCurrentSQL(`SELECT * FROM ${table.name};`);
  };

  const handleNLCommand = async (input) => {
    setIsLoading(true);
    
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = parseNaturalLanguage(input);
    setCurrentSQL(result.sql);
    
    // Find table for result display
    if (result.tableName) {
      const foundTable = tables.find(table => table.name === result.tableName);
      if (foundTable && (result.type === 'SELECT' || result.type === 'INSERT')) {
        setQueryResult(foundTable);
        setSelectedTable(foundTable);
      } else {
        setQueryResult(null);
      }
    } else {
      setQueryResult(null);
    }
    
    setIsLoading(false);
  };

  const renderContent = () => {
    const commonProps = {
      tables,
      setTables,
      currentSQL,
      setCurrentSQL,
      isLoading,
      queryResult,
      handleNLCommand,
      isSidebarOpen
    };

    switch (activeTab) {
      case 'Designer':
        return <Designer {...commonProps} />;
      case 'Query':
        return <Query {...commonProps} />;
      case 'Schema':
        return <Schema {...commonProps} />;
      case 'API':
        return <API {...commonProps} />;
      default:
        return <Designer {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSidebarToggle={handleSidebarToggle}
      />
      
      <Sidebar
        tables={tables}
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        onTableSelect={handleTableSelect}
        selectedTable={selectedTable}
      />
      
      <main className={`
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}
        container mx-auto px-6 py-8
      `}>
        {renderContent()}
      </main>
    </div>
  );
}
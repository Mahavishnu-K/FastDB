// pages/API.jsx
import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink, Key, Globe, Book } from 'lucide-react';

const API = () => {
  const [activeTab, setActiveTab] = useState('REST');
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const restEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/tables',
      description: 'Get all database tables',
      response: `{
  "tables": [
    {
      "id": 1,
      "name": "students",
      "columns": [...],
      "rowCount": 150
    }
  ]
}`
    },
    {
      method: 'POST',
      endpoint: '/api/query',
      description: 'Execute natural language query',
      body: `{
  "query": "Show all students with age > 20",
  "format": "json"
}`,
      response: `{
  "sql": "SELECT * FROM students WHERE age > 20;",
  "results": [...],
  "executionTime": "0.045s"
}`
    },
    {
      method: 'POST',
      endpoint: '/api/schema',
      description: 'Create or update table schema',
      body: `{
  "action": "create_table",
  "tableName": "products",
  "columns": [...]
}`,
      response: `{
  "success": true,
  "message": "Table created successfully",
  "sql": "CREATE TABLE products (...)"
}`
    },
    {
      method: 'GET',
      endpoint: '/api/export/{format}',
      description: 'Export database schema',
      response: `{
  "schema": {...},
  "downloadUrl": "https://api.example.com/download/abc123"
}`
    }
  ];

  const sdkExamples = {
    javascript: `// Install: npm install nl-database-sdk
import { NLDatabase } from 'nl-database-sdk';

const db = new NLDatabase({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.nl-database.com'
});

// Execute natural language query
const result = await db.query('Show all users older than 25');
console.log(result.data);

// Create table
await db.createTable('Create a table for orders with customer name and total');

// Export schema
const schema = await db.exportSchema('json');`,
    
    python: `# Install: pip install nl-database-sdk
from nl_database import NLDatabase

db = NLDatabase(
    api_key='your-api-key',
    base_url='https://api.nl-database.com'
)

# Execute query
result = db.query('Show all users older than 25')
print(result['data'])

# Create table
db.create_table('Create a table for orders with customer name and total')

# Export schema
schema = db.export_schema('json')`,
    
    curl: `# Execute natural language query
curl -X POST "https://api.nl-database.com/api/query" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Show all students with high marks",
    "format": "json"
  }'

# Get all tables
curl -X GET "https://api.nl-database.com/api/tables" \\
  -H "Authorization: Bearer your-api-key"`
  };

  const CodeBlock = ({ code, language = 'javascript', id }) => (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-700 px-4 py-2 rounded-t-lg">
        <span className="text-sm font-medium text-gray-300">{language}</span>
        <button
          onClick={() => handleCopy(code, id)}
          className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
        >
          {copiedCode === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="text-sm">{copiedCode === id ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-300 p-4 rounded-b-lg overflow-x-auto text-sm font-mono">
        {code}
      </pre>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Developer API</h2>
        <p className="text-gray-400">Integrate NL Database into your applications</p>
      </div>

      {/* API Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {['REST', 'SDK', 'Webhooks'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* REST API Documentation */}
      {activeTab === 'REST' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-400" />
              <span>REST API Endpoints</span>
            </h3>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">
                <strong>Base URL:</strong> https://api.nl-database.com
              </p>
              <p className="text-blue-300 text-sm mt-1">
                <strong>Authentication:</strong> Bearer Token (API Key required)
              </p>
            </div>
            
            <div className="space-y-6">
              {restEndpoints.map((endpoint, idx) => (
                <div key={idx} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      endpoint.method === 'GET' ? 'bg-green-600 text-green-100' :
                      endpoint.method === 'POST' ? 'bg-blue-600 text-blue-100' :
                      'bg-yellow-600 text-yellow-100'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-gray-300 font-mono">{endpoint.endpoint}</code>
                  </div>
                  <p className="text-gray-400 mb-3">{endpoint.description}</p>
                  
                  {endpoint.body && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-white mb-2">Request Body:</h5>
                      <CodeBlock code={endpoint.body} language="json" id={`body-${idx}`} />
                    </div>
                  )}
                  
                  <div>
                    <h5 className="text-sm font-medium text-white mb-2">Response:</h5>
                    <CodeBlock code={endpoint.response} language="json" id={`response-${idx}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SDK Documentation */}
      {activeTab === 'SDK' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Code className="w-5 h-5 text-purple-400" />
              <span>SDK Integration</span>
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🟨</div>
                <h4 className="font-semibold text-white">JavaScript</h4>
                <p className="text-sm text-gray-400">Node.js & Browser</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🐍</div>
                <h4 className="font-semibold text-white">Python</h4>
                <p className="text-sm text-gray-400">pip install</p>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🌐</div>
                <h4 className="font-semibold text-white">cURL</h4>
                <p className="text-sm text-gray-400">Direct HTTP</p>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(sdkExamples).map(([lang, code]) => (
                <div key={lang}>
                  <h4 className="text-lg font-medium text-white mb-3 capitalize">{lang} Example</h4>
                  <CodeBlock code={code} language={lang} id={`sdk-${lang}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Webhooks */}
      {activeTab === 'Webhooks' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-orange-400" />
              <span>Webhooks</span>
            </h3>
            
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-6">
              <p className="text-orange-300 text-sm">
                Get real-time notifications when database changes occur or queries are executed.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Schema Changes</h4>
                <p className="text-gray-400 text-sm mb-3">Triggered when tables are created, modified, or deleted</p>
                <CodeBlock 
                  code={`{
  "event": "schema.table.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "tableName": "products",
    "columns": [...],
    "userId": "user_123"
  }
}`} 
                  language="json" 
                  id="webhook-schema" 
                />
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Query Execution</h4>
                <p className="text-gray-400 text-sm mb-3">Triggered when natural language queries are processed</p>
                <CodeBlock 
                  code={`{
  "event": "query.executed",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "query": "Show all high-performing students",
    "sql": "SELECT * FROM students WHERE marks > 90",
    "executionTime": "0.045s",
    "resultCount": 25
  }
}`} 
                  language="json" 
                  id="webhook-query" 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <Key className="w-5 h-5 text-yellow-400" />
          <span>Authentication</span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white mb-3">Get Your API Key</h4>
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <code className="text-green-400 font-mono text-sm">nl_db_1234567890abcdef</code>
              <button className="ml-3 text-blue-400 hover:text-blue-300 text-sm">
                Generate New Key
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-3">Rate Limits</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Queries per minute:</span>
                <span className="text-green-400">100</span>
              </div>
              <div className="flex justify-between">
                <span>Schema operations:</span>
                <span className="text-yellow-400">20/hour</span>
              </div>
              <div className="flex justify-between">
                <span>Export operations:</span>
                <span className="text-blue-400">10/day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default API;
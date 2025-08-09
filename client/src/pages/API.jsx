import { AnimatePresence, motion } from 'framer-motion';
import { Book, Check, Code, Copy, ExternalLink, Globe, Key, TerminalSquare } from 'lucide-react';
import { useState } from 'react';

const API = () => {
  const [activeTab, setActiveTab] = useState('REST');
  const [copiedCode, setCopiedCode] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  const handleCopyKey = (key) => {
      navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
  }

  const restEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/databases',
      description: 'Get all available databases for the user.',
      response: `[
  {
    "id": "db_1",
    "virtual_name": "production_db",
    "db_type": "postgres"
  }
]`
    },
    {
      method: 'GET',
      endpoint: '/api/schema',
      description: 'Get the full schema for a target database.',
      headers: `// Required Header\n"X-Target-Database": "production_db"`,
      response: `{
  "tables": [...],
  "views": [...],
  "indexes": [...]
}`
    },
    {
      method: 'POST',
      endpoint: '/api/query',
      description: 'Execute a natural language or SQL query.',
      headers: `// Required Header\n"X-Target-Database": "production_db"`,
      body: `{
  "command": "show all users with age > 20"
}`,
      response: `{
  "sql_query": "SELECT * FROM users WHERE age > 20;",
  "result": {
    "data": [...]
  },
  "execution_time_ms": 45.12
}`
    }
  ];

  const sdkExamples = {
    javascript: `// Install: npm install fastdb-sdk
import { FastDB } from 'fastdb-sdk';

const db = new FastDB({
  apiKey: 'YOUR_API_KEY',
  database: 'production_db'
});

// Execute natural language query
const { result } = await db.query('Show all users older than 25');
console.log(result.data);

// Get schema
const schema = await db.getSchema();`,
    
    python: `# Install: pip install fastdb-sdk
from fastdb import FastDB

db = FastDB(
    api_key='YOUR_API_KEY',
    database='production_db'
)

# Execute query
result = db.query('Show all users older than 25')
print(result['result']['data'])

# Get schema
schema = db.get_schema()`,
    
    curl: `# Execute natural language query
curl -X POST "https://api.fastdb.dev/api/query" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Target-Database: production_db" \\
  -H "Content-Type: application/json" \\
  -d '{
    "command": "show 5 customers"
  }'`
  };

  const CodeBlock = ({ code, language = 'javascript', id }) => (
    <div className="relative bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg">
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-t-lg border-b border-border-light dark:border-border-dark">
        <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark capitalize">{language}</span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCopy(code, id)}
          className="flex items-center space-x-1 text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors text-sm"
        >
          {copiedCode === id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          <span>{copiedCode === id ? 'Copied!' : 'Copy'}</span>
        </motion.button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono">
        {code}
      </pre>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium">Developer API</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark">Integrate FastDB into your applications.</p>
      </div>

      <div className="flex space-x-1 bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark p-1 rounded-lg">
        {['REST', 'SDK', 'Webhooks'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 px-4 rounded-md font-medium transition-colors text-sm ${
              activeTab === tab
                ? 'bg-slate-100 dark:bg-slate-800 text-text-light dark:text-text-dark shadow-sm'
                : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
        >

      {/* REST API Documentation */}
      {activeTab === 'REST' && (
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-6">
            <h3 className="text-base font-semibold text-text-light dark:text-text-dark flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-500" />
              <span>REST API Endpoints</span>
            </h3>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>Base URL:</strong> https://api.fastdb.dev
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                <strong>Authentication:</strong> Bearer Token (API Key required)
              </p>
            </div>
            
            <div className="space-y-4">
              {restEndpoints.map((endpoint, idx) => (
                <div key={idx} className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      endpoint.method === 'GET' ? 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20' :
                      endpoint.method === 'POST' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20' :
                      'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-500/20'
                    }`}>{endpoint.method}</span>
                    <code className="text-sm font-mono">{endpoint.endpoint}</code>
                  </div>
                  <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-3">{endpoint.description}</p>
                  
                  {endpoint.headers && (
                    <div className="mb-3"><h5 className="text-xs font-semibold mb-1 uppercase tracking-wider">Headers</h5><CodeBlock code={endpoint.headers} language="json" id={`headers-${idx}`}/></div>
                  )}
                  {endpoint.body && (
                    <div className="mb-3"><h5 className="text-xs font-semibold mb-1 uppercase tracking-wider">Request Body</h5><CodeBlock code={endpoint.body} language="json" id={`body-${idx}`}/></div>
                  )}
                  <div><h5 className="text-xs font-semibold mb-1 uppercase tracking-wider">Response</h5><CodeBlock code={endpoint.response} language="json" id={`response-${idx}`}/></div>
                </div>
              ))}
            </div>
          </div>
      )}

      {/* SDK Documentation */}
      {activeTab === 'SDK' && (
         <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-6">
            <h3 className="text-base font-semibold text-text-light dark:text-text-dark flex items-center space-x-2">
              <Book className="w-5 h-5 text-purple-500" />
              <span>SDK Integration</span>
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg p-4 text-center">
                <Code className="w-8 h-8 text-yellow-500 mx-auto mb-2"/>
                <h4 className="font-semibold">JavaScript</h4>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Node.js & Browser</p>
              </div>
              <div className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg p-4 text-center">
                <TerminalSquare className="w-8 h-8 text-blue-500 mx-auto mb-2"/>
                <h4 className="font-semibold">Python</h4>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">pip install</p>
              </div>
              <div className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg p-4 text-center">
                <Globe className="w-8 h-8 text-green-500 mx-auto mb-2"/>
                <h4 className="font-semibold">cURL</h4>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Direct HTTP</p>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(sdkExamples).map(([lang, code]) => (
                <div key={lang}><h4 className="text-base font-medium mb-2 capitalize">{lang} Example</h4><CodeBlock code={code} language={lang} id={`sdk-${lang}`}/></div>
              ))}
            </div>
          </div>
      )}

      {/* Webhooks */}
      {activeTab === 'Webhooks' && (
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-6">
            <h3 className="text-base font-semibold text-text-light dark:text-text-dark flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-orange-500" />
              <span>Webhooks</span>
            </h3>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4"><p className="text-orange-700 dark:text-orange-300 text-sm">Get real-time notifications for database events.</p></div>
            <div className="space-y-4">
              <div className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg p-4"><h4 className="font-medium mb-2">Schema Changes</h4><p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-3">Triggered when tables are created, modified, or deleted.</p><CodeBlock code={`{\n  "event": "schema.table.created",\n  "timestamp": "2024-01-15T10:30:00Z",\n  "data": {\n    "tableName": "products",\n    "columns": [...]\n  }\n}`} language="json" id="webhook-schema"/></div>
              <div className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-lg p-4"><h4 className="font-medium mb-2">Query Execution</h4><p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-3">Triggered when natural language queries are processed.</p><CodeBlock code={`{\n  "event": "query.executed",\n  "timestamp": "2024-01-15T10:35:00Z",\n  "data": {\n    "natural_query": "Show all high-performing students",\n    "sql_query": "SELECT * FROM students WHERE marks > 90",\n    "execution_time_ms": 45.12,\n    "result_count": 25\n  }\n}`} language="json" id="webhook-query"/></div>
            </div>
        </div>
      )}
      
      </motion.div>
      </AnimatePresence>

      <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg p-6">
        <h3 className="text-base font-semibold text-text-light dark:text-text-dark flex items-center space-x-2 mb-4">
          <Key className="w-5 h-5 text-yellow-500" />
          <span>Authentication & Limits</span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Your API Key</h4>
            <div className="flex items-center space-x-2 p-2 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md">
                <code className="text-sm font-mono text-green-600 dark:text-green-400 truncate flex-1">fd_live_123abc456def789ghi</code>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCopyKey('fd_live_123abc456def789ghi')} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                    {copiedKey ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}
                </motion.button>
            </div>
             <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Generate New Key
              </button>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Rate Limits</h4>
            <ul className="space-y-2 text-sm text-text-muted-light dark:text-text-muted-dark">
              <li className="flex justify-between"><span>Queries per minute:</span><span className="font-mono text-text-light dark:text-text-dark">100</span></li>
              <li className="flex justify-between"><span>Schema operations / hour:</span><span className="font-mono text-text-light dark:text-text-dark">20</span></li>
              <li className="flex justify-between"><span>Export operations / day:</span><span className="font-mono text-text-light dark:text-text-dark">10</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default API;
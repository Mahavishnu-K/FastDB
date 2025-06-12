// components/ERDiagram.jsx
import React, { useState } from 'react';
import { GitBranch, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

const ERDiagram = ({ tables }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`bg-gray-950 border border-gray-600 rounded-lg p-6 shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          <span>Entity Relationship Diagram</span>
        </h4>
        <div className="flex items-center space-x-2">
          <button className="text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-8 min-h-[400px] relative border border-gray-700">
        
        <div className="flex justify-center items-center h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {tables.map((table, index) => (
              <div key={table.id} className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
                <div className="bg-gray-900 border-b-gray-600 text-white px-4 py-2 font-semibold">
                  {table.name}
                </div>
                <div className="p-4 space-y-2">
                  {table.columns.map((column, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className={`text-gray-300 ${column.primaryKey ? 'font-bold' : ''}`}>
                        {column.primaryKey && '🔑 '}{column.name}
                      </span>
                      <span className="text-gray-500 text-xs">{column.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connecting lines placeholder */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
             refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
          </defs>
          {/* Example relationship line */}
          <line x1="50%" y1="30%" x2="50%" y2="70%" 
                stroke="#6B7280" strokeWidth="2" strokeDasharray="5,5" 
                markerEnd="url(#arrowhead)" />
        </svg>

        <div className="absolute bottom-4 right-4 text-gray-500 text-sm">
          <p>Mermaid.js integration ready</p>
        </div>
      </div>
    </div>
  );
};

export default ERDiagram;
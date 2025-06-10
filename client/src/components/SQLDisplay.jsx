// components/SQLDisplay.jsx
import React, { useState } from 'react';
import { Code, Copy, Check, Eye, EyeOff } from 'lucide-react';

const SQLDisplay = ({ sql, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!sql) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-md font-semibold text-white flex items-center space-x-2">
          <Code className="w-4 h-4 text-green-400" />
          <span>Generated SQL</span>
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{isExpanded ? 'Hide' : 'Show'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="relative">
          <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-700">
            {sql}
          </pre>
          <div className="absolute top-2 right-2">
            <span className="bg-green-600 text-green-100 text-xs px-2 py-1 rounded">SQL</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLDisplay;
import React, { useState, useEffect } from 'react';
import { Play, BrainCircuit } from 'lucide-react'; 

const NLInput = ({ onExecute, isLoading }) => {
  const [input, setInput] = useState('');
  const [suggestions] = useState([
    'Show all students',
    'Create a table for users with name, email, and age',
    'Update students set age = 21 where name = "John"',
    'Delete from products where price < 10'
  ]);

  const handleSubmit = () => {
    if (input.trim()) {
      onExecute(input);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    // The main container now only handles the outer border and rounding
    <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg">
      
      {/* --- NEW HEADER SECTION --- */}
      <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark">
        <h4 className="text-sm font-semibold flex items-center space-x-2">
          <BrainCircuit className="w-4 h-4 text-cyan-500" />
          <span>AI Command</span>
        </h4>
      </div>

      {/* Main content area with padding */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or type a command... (Press Enter to execute)"
            className="flex-1 bg-transparent text-sm placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none"
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center space-x-2 transition-all transform hover:scale-105"
            aria-label="Execute command"
          >
            <Play className="w-4 h-4" />
            <span>{isLoading ? 'Running...' : 'Run'}</span>
          </button>
        </div>
        
        <div className="mt-3 pt-4 border-t border-border-light dark:border-border-dark">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark px-2.5 py-1 rounded-full transition-colors border border-border-light dark:border-border-dark"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NLInput;
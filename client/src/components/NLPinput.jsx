import React, { useState } from 'react';
import { Play, Lightbulb } from 'lucide-react';

const NLInput = ({ onExecute, isLoading }) => {
  const [input, setInput] = useState('');
  const [suggestions] = useState([
    'Create a table for users with name, email, and age',
    'Show all students',
    'Add a new product with name and price',
    'Create a table for orders with customer and total',
    'Update students set age = 21 where name = "John"',
    'Delete from products where price < 10'
  ]);

  const handleSubmit = () => {
    if (input.trim()) {
      onExecute(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="bg-gray-950 border border-gray-600 rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Natural Language Command</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your command..."
            className="flex-1 bg-gray-900 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="border border-gray-600 bg-gray-900 disabled:bg-gray-950 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>{isLoading ? 'Processing...' : 'Execute'}</span>
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-400 mb-3 flex items-center space-x-2">
          <span>💡 Try these examples:</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs bg-gray-800 hover:bg-gray-900 text-gray-300 hover:text-white px-3 py-2 rounded-full transition-colors border border-gray-600 hover:border-gray-500"
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NLInput; 
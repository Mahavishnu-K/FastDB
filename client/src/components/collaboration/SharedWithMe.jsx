import React from 'react';
import { Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const SharedWithMe = ({ databases }) => {
  const navigate = useNavigate();
  const handleDbChange = useAppStore(state => state.handleDbChange);

  const handleSelectDb = (dbName) => {
    handleDbChange(dbName);
    navigate('/query');
  };

  if (databases.length === 0) {
    return <p className="text-gray-500 text-sm">No databases have been shared with you yet.</p>;
  }

  return (
    <div className="space-y-3">
      {databases.map(db => (
        <div 
          key={db.id} 
          onClick={() => handleSelectDb(db.virtual_name)}
          className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-purple-500 hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-white">{db.virtual_name}</span>
          </div>
          <span className="text-xs text-gray-500">Click to open</span>
        </div>
      ))}
    </div>
  );
};

export default SharedWithMe;
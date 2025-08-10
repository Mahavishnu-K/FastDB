import React, { useState } from 'react';
import { Mail, Send, X, Users, Loader } from 'lucide-react';
import * as api from '../../services/apiServices';

const InviteMemberModal = ({ dbName, onClose, onInviteSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.inviteUserToDb(dbName, email, role);
      onInviteSuccess(); // This will close the modal and refresh the data
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send invite. Please check the email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500"/>
              Share "{dbName}"
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage who has access to this database.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleInvite}>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">Invite new member</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="w-full bg-gray-100 dark:bg-gray-800 p-2 pl-10 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-white"
                />
              </div>
              <select value={role} onChange={e => setRole(e.target.value)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-white">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 font-semibold hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isLoading ? <Loader className="animate-spin w-5 h-5"/> : <Send className="w-4 h-4" />}
                Invite
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </form>
          
          {/* Existing members section will be in the main component */}
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;
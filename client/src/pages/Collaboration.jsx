import React, { useState, useEffect, useCallback } from 'react';
import { Users, Share2, GitMerge, UserPlus, Trash2, Shield, Eye, Edit3, Mail, Send, X, Loader, Database } from 'lucide-react';
import * as api from '../services/apiServices';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

// ===================================================================
// === Sub-Component 1: The Invite Modal ===
// ===================================================================
const InviteMemberModal = ({ dbName, onClose, onInviteSuccess }) => {
  const [email, setEmail] =useState('');
  const [role, setRole] = useState('editor');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.inviteUserToDb(dbName, email, role);
      onInviteSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send invite. Please check the email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
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
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" required className="w-full bg-gray-100 dark:bg-gray-800 p-2 pl-10 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-white" />
              </div>
              <select value={role} onChange={e => setRole(e.target.value)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-white">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 font-semibold hover:bg-blue-700 disabled:bg-blue-400">
                {isLoading ? <Loader className="animate-spin w-5 h-5"/> : <Send className="w-4 h-4" />}
                Invite
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// === Sub-Component 2: The "Shared By Me" Section ===
// ===================================================================
const MemberRow = ({ dbName, member, onUpdate }) => {
  const [newRole, setNewRole] = useState(member.role);

  const handleRoleChange = async (e) => {
    const role = e.target.value;
    setNewRole(role);
    try {
      await api.updateMemberRole(dbName, member.user_id, role);
      onUpdate(); // Refresh the member list
    } catch (error) {
      console.error("Failed to update role", error);
      setNewRole(member.role); // Revert on failure
    }
  };

  const handleRemove = async () => {
    if (window.confirm(`Are you sure you want to remove ${member.email} from this database?`)) {
      try {
        await api.removeMemberFromDb(dbName, member.user_id);
        onUpdate();
      } catch (error) {
        console.error("Failed to remove member", error);
      }
    }
  };
  
  const roleIcons = {
    owner: <Shield className="w-4 h-4 text-yellow-400" />,
    editor: <Edit3 className="w-4 h-4 text-blue-400" />,
    viewer: <Eye className="w-4 h-4 text-gray-400" />,
  };

  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-800">
      <div className="flex items-center gap-3">
        {roleIcons[member.role]}
        <div>
          <p className="font-medium text-white">{member.name}</p>
          <p className="text-xs text-gray-400">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {member.role !== 'owner' ? (
          <>
            <select value={newRole} onChange={handleRoleChange} className="bg-gray-700 text-xs p-1 rounded">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button onClick={handleRemove} className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
          </>
        ) : (
          <span className="text-xs text-yellow-400 font-semibold">Owner</span>
        )}
      </div>
    </div>
  );
};


const SharedDbCard = ({ database, onUpdate }) => {
  const [members, setMembers] = useState([]);
  const [isInviting, setIsInviting] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const memberList = await api.getDatabaseMembers(database.virtual_name);
      setMembers(memberList);
    } catch (error) {
      console.error("Failed to fetch members", error);
    }
  }, [database.virtual_name]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">{database.virtual_name}</h3>
        <button onClick={() => setIsInviting(true)} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
          <UserPlus className="w-4 h-4" /> Invite
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {members.map(member => (
          <MemberRow key={member.user_id} dbName={database.virtual_name} member={member} onUpdate={fetchMembers} />
        ))}
      </div>
      {isInviting && <InviteMemberModal dbName={database.virtual_name} onClose={() => setIsInviting(false)} onInviteSuccess={() => { fetchMembers(); setIsInviting(false); }} />}
    </div>
  );
};

const SharedByMe = ({ databases }) => {
  if (databases.length === 0) {
    return <p className="text-gray-500 text-sm">You haven't shared any of your databases yet. Invite collaborators to get started!</p>;
  }
  return <div className="space-y-4">{databases.map(db => <SharedDbCard key={db.id} database={db} />)}</div>;
};

// ===================================================================
// === Sub-Component 3: The "Shared With Me" Section ===
// ===================================================================
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
        <div key={db.id} onClick={() => handleSelectDb(db.virtual_name)} className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-purple-500 hover:bg-gray-800 transition-colors">
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

// ===================================================================
// === Main Page Component ===
// ===================================================================
const CollaborationPage = () => {
  const { user } = useUser();
  const [sharedByMe, setSharedByMe] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [byMeData, withMeData] = await Promise.all([
        api.listDbsSharedByMe(),
        api.listDbsSharedWithMe()
      ]);
      setSharedByMe(byMeData);
      setSharedWithMe(withMeData);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(`Failed to fetch collaboration data: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <div className="text-center p-8 text-gray-400">Loading collaboration data...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-gray-800 dark:text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          Collaboration Hub
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Manage database access for your team and view projects shared with you.
        </p>
      </div>
      {/* <InviteMemberModal/> */}
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg" role="alert"><strong>Error:</strong> {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-green-500" />
            Databases I've Shared
          </h2>
          <SharedByMe databases={sharedByMe} />
        </div>

        <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
            <GitMerge className="w-5 h-5 text-purple-500" />
            Shared With Me
          </h2>
          <SharedWithMe databases={sharedWithMe} />
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;
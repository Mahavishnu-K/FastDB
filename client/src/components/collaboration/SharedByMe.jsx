import React, { useState, useEffect } from 'react';
import { UserPlus, MoreVertical, Edit, Trash2, Shield, Eye, Edit3 } from 'lucide-react';
import * as api from '../../services/apiServices';

// A modal for inviting new members
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
      onInviteSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send invite.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-white">Invite Collaborator to "{dbName}"</h3>
        <form onSubmit={handleInvite}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter user's email" required className="w-full bg-gray-700 p-2 rounded mb-4 text-white" />
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-gray-700 p-2 rounded mb-4 text-white">
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800">{isLoading ? 'Sending...' : 'Send Invite'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// A single row representing a collaborator
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

// The main component for one shared database
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

const SharedByMe = ({ databases, onUpdate }) => {
  if (databases.length === 0) {
    return <p className="text-gray-500 text-sm">You haven't shared any of your databases yet.</p>;
  }

  return (
    <div className="space-y-4">
      {databases.map(db => (
        <SharedDbCard key={db.id} database={db} onUpdate={onUpdate} />
      ))}
    </div>
  );
};

export default SharedByMe;
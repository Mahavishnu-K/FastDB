import React, { useState, useEffect, useCallback } from 'react';
import { Users, Share2, GitMerge, UserPlus, Trash2, Shield, Eye, Edit3, Mail, Send, X, Loader, Database, Crown, ChevronRight, Settings2 } from 'lucide-react';
import * as api from '../services/apiServices';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useConfirm } from '../contexts/ConfirmationContext';

// ===================================================================
// === Sub-Component 1: The Invite Modal (Updated to match Dashboard style) ===
// ===================================================================
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
      setError(err.response?.data?.detail || 'Failed to send invite. Please check the email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-fg-light dark:bg-fg-dark rounded-lg shadow-2xl w-full max-w-lg border border-border-light dark:border-border-dark" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-border-light dark:border-border-dark flex justify-between items-center">
          <h2 className="text-lg font-medium text-text-light dark:text-text-dark flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500"/>
            Invite to "{dbName}"
          </h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleInvite}>
          <div className="p-3 space-y-4">
            <div>
              <label className="text-sm font-medium text-text-light dark:text-text-dark mb-2 block">Member's Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="user@example.com" 
                  required 
                  className="w-full bg-bg-light dark:bg-bg-dark p-3 pl-10 rounded-md border border-border-light dark:border-border-dark focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm" 
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-light dark:text-text-dark mb-2 block">Role</label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                className="w-full bg-bg-light dark:bg-bg-dark p-3 rounded-md border border-border-light dark:border-border-dark focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end rounded-b-lg border-t border-border-light dark:border-border-dark">
            <button 
              type="submit" 
              disabled={isLoading} 
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader className="animate-spin w-4 h-4"/> : <Send className="w-4 h-4" />}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===================================================================
// === Sub-Component 2: Member Row Component ===
// ===================================================================
const MemberRow = ({ dbName, member, onUpdate, currentUserRole }) => {
  const [newRole, setNewRole] = useState(member.role);
  const confirm = useConfirm();

  const handleRoleChange = async (e) => {
    const role = e.target.value;
    setNewRole(role);
    try {
      await api.updateMemberRole(dbName, member.user_id, role);
      onUpdate();
    } catch (error) {
      console.error("Failed to update role", error);
      setNewRole(member.role);
    }
  };

  const handleRemove = async () => {
    const wasConfirmed = await confirm({
      title: `Remove ${member.name}?`,
      message: `Are you sure you want to remove access for ${member.email}? This cannot be undone.`,
      isDestructive: true
    });
    if (wasConfirmed) {
      try {
        await api.removeMemberFromDb(dbName, member.user_id);
        onUpdate();
      } catch (error) {
        console.error("Failed to remove member", error);
      }
    }
  };
  
  const roleIcons = {
    owner: <Crown className="w-4 h-4 text-yellow-500" title="Owner"/>,
    editor: <Edit3 className="w-4 h-4 text-blue-500" title="Editor"/>,
    viewer: <Eye className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" title="Viewer"/>,
  };

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';

  return (
    <div className="bg-bg-light dark:bg-bg-dark rounded-md p-3 border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {roleIcons[member.role]}
          <div>
            <p className="font-medium text-sm text-text-light dark:text-text-dark">{member.name}</p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {member.role !== 'owner' ? (
            <>
              {canEdit ? (
                <div className="flex items-center gap-2">
                  <select 
                    value={newRole} 
                    onChange={handleRoleChange} 
                    className="bg-fg-light dark:bg-fg-dark text-xs px-2 py-1 rounded border border-border-light dark:border-border-dark focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button 
                    onClick={handleRemove} 
                    className="p-1.5 text-text-muted-light dark:text-text-muted-dark hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark capitalize px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  {member.role}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium px-2 py-1 bg-yellow-500/10 rounded">
              Owner
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// === Sub-Component 3: Shared Database Card ===
// ===================================================================
const SharedDbCard = ({ database, currentUserRole }) => {
  const [members, setMembers] = useState([]);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!isManaging) return;
    setIsLoadingMembers(true);
    try {
      const memberList = await api.getDatabaseMembers(database.virtual_name);
      setMembers(memberList);
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [database.virtual_name, isManaging]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleToggleManage = () => {
    setIsManaging(prev => !prev);
  }

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';

  return (
    <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg">
      <div className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-blue-500"/>
          <h3 className="font-medium text-text-light dark:text-text-dark">{database.virtual_name}</h3>
        </div>
        <button 
          onClick={handleToggleManage} 
          className="flex items-center gap-2 text-sm font-medium bg-bg-light dark:bg-bg-dark px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 border border-border-light dark:border-border-dark transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          <span>{isManaging ? 'Close' : 'Manage Access'}</span>
        </button>
      </div>

      {isManaging && (
        <div className="border-t border-border-light dark:border-border-dark p-4">
          {isLoadingMembers ? (
            <div className="text-center py-8">
              <Loader className="animate-spin w-6 h-6 mx-auto text-blue-500"/>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">Loading members...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                {members.map(member => (
                  <MemberRow 
                    key={member.user_id} 
                    dbName={database.virtual_name} 
                    member={member} 
                    onUpdate={fetchMembers} 
                    currentUserRole={currentUserRole} 
                  />
                ))}
              </div>
              {canEdit && (
                <div className="pt-3 border-t border-border-light dark:border-border-dark">
                  <button 
                    onClick={() => setIsInviting(true)} 
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite New Member
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isInviting && (
        <InviteMemberModal 
          dbName={database.virtual_name} 
          onClose={() => setIsInviting(false)} 
          onInviteSuccess={() => { 
            fetchMembers(); 
            setIsInviting(false); 
          }} 
        />
      )}
    </div>
  );
};

// ===================================================================
// === Sub-Component 4: Shared By Me Section ===
// ===================================================================
const SharedByMe = ({ databases }) => {
  const { user } = useUser();
  
  if (databases.length === 0) {
    return (
      <div className="text-center py-12">
        <Share2 className="w-12 h-12 mx-auto text-text-muted-light dark:text-text-muted-dark mb-4" />
        <p className="text-text-muted-light dark:text-text-muted-dark">No shared databases yet</p>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
          Start collaborating by sharing your databases with team members.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {databases.map(db => (
        <SharedDbCard 
          key={db.id} 
          database={db} 
          currentUserRole={db.owner_id === user?.id ? 'owner' : 'editor'}
        />
      ))}
    </div>
  );
};

// ===================================================================
// === Sub-Component 5: Shared With Me Section ===
// ===================================================================
const SharedWithMe = ({ databases }) => {
  const navigate = useNavigate();
  const handleDbChange = useAppStore(state => state.handleDbChange);

  const handleSelectDb = (dbName) => {
    handleDbChange(dbName);
    navigate('/query');
  };

  if (databases.length === 0) {
    return (
      <div className="text-center py-12">
        <GitMerge className="w-12 h-12 mx-auto text-text-muted-light dark:text-text-muted-dark mb-4" />
        <p className="text-text-muted-light dark:text-text-muted-dark">No shared databases</p>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
          Databases shared with you will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {databases.map(db => (
        <div 
          key={db.id} 
          onClick={() => handleSelectDb(db.virtual_name)} 
          className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md p-4 flex items-center justify-between cursor-pointer hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark group-hover:text-blue-500 transition-colors" />
            <span className="font-medium text-text-light dark:text-text-dark">{db.virtual_name}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark group-hover:text-blue-500 transition-colors" />
        </div>
      ))}
    </div>
  );
};

// ===================================================================
// === Main Page Component ===
// ===================================================================
const CollaborationPage = () => {
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
    return (
      <div className="text-center py-12">
        <Loader className="w-8 h-8 animate-spin mx-auto text-blue-500"/>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-4">Loading collaboration data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-medium text-text-light dark:text-text-dark flex items-center gap-3">
          Collaboration
        </h1>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
          Manage database access for your team and view projects shared with you.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-lg" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Databases I've Shared */}
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg">
          <div className="p-3 border-b border-border-light dark:border-border-dark">
            <h2 className="font-medium text-text-light dark:text-text-dark flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-500" />
              Databases I've Shared
            </h2>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
              Manage access to your databases
            </p>
          </div>
          <div className="p-3">
            <SharedByMe databases={sharedByMe} />
          </div>
        </div>

        {/* Shared With Me */}
        <div className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg">
          <div className="p-3 border-b border-border-light dark:border-border-dark">
            <h2 className="font-medium text-text-light dark:text-text-dark flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-blue-500" />
              Shared With Me
            </h2>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
              Access databases shared by others
            </p>
          </div>
          <div className="p-3">
            <SharedWithMe databases={sharedWithMe} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;
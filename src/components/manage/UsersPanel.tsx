import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { UserProfile, getCheckedOutItems, CheckedOutItem } from '../../services/profileService';
import { CreateUserModal } from './CreateUserModal';
import { InviteUserModal } from './InviteUserModal';

const ROLE_LABELS: Record<number, string> = {
  0: 'User',
  1: 'Member',
  2: 'Lead',
  3: 'Chief',
  4: 'Admin',
};

const ROLE_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  1: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  2: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  3: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  4: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

interface UserRowProps {
  user: UserProfile;
  onUpdated: () => void;
  teams: string[];
}

const UserRow: React.FC<UserRowProps> = ({ user, onUpdated, teams }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [checkedOutItems, setCheckedOutItems] = useState<CheckedOutItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editRole, setEditRole] = useState(user.role);
  const [editTeam, setEditTeam] = useState(user.team);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadCheckedOut = useCallback(async () => {
    setLoadingItems(true);
    try {
      const items = await getCheckedOutItems(user.uid);
      setCheckedOutItems(items);
    } finally {
      setLoadingItems(false);
    }
  }, [user.uid]);

  useEffect(() => {
    if (expanded) loadCheckedOut();
  }, [expanded, loadCheckedOut]);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        team: editTeam,
      });
      setEditing(false);
      onUpdated();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <tr
        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3">
          <div className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.team || '—'}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role] || ROLE_COLORS[0]}`}>
            {ROLE_LABELS[user.role] ?? `Role ${user.role}`}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">{checkedOutItems.length > 0 ? checkedOutItems.length : '—'}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={e => { e.stopPropagation(); setEditing(true); setExpanded(true); }}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Edit
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50 dark:bg-gray-900">
          <td colSpan={5} className="px-6 py-4">
            {editing ? (
              <div className="space-y-3 max-w-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Edit User</h4>
                {saveError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                    <input
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
                    <select
                      value={editRole}
                      onChange={e => setEditRole(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {Object.entries(ROLE_LABELS).map(([v, label]) => (
                        <option key={v} value={v}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Team</label>
                    <select
                      value={editTeam}
                      onChange={e => setEditTeam(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">None</option>
                      {teams.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Checked Out Items
                </h4>
                {loadingItems ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : checkedOutItems.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-600">No items currently checked out.</p>
                ) : (
                  <div className="space-y-1">
                    {checkedOutItems.map(item => {
                      const durationMs = item.updatedAt?.toMillis
                        ? Date.now() - item.updatedAt.toMillis()
                        : null;
                      return (
                        <div key={item.itemId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{item.itemId}</span>
                          <span className="text-gray-500 dark:text-gray-400">qty: {item.qty}</span>
                          {durationMs !== null && (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">
                              {formatDuration(durationMs)} ago
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

export const UsersPanel: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      list.sort((a, b) => (b.role ?? 0) - (a.role ?? 0));
      setUsers(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    getDoc(doc(db, 'metadata', 'teams')).then(snap => {
      if (snap.exists()) setTeams(snap.data().teams || []);
    });
  }, [loadUsers]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <span className="text-sm text-gray-500 dark:text-gray-400">{users.length} users</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Invite User</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items Out</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <UserRow
                  key={user.uid}
                  user={user}
                  teams={teams}
                  onUpdated={loadUsers}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onSuccess={loadUsers} />
      )}
      {showInvite && (
        <InviteUserModal onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { createManagedUser } from '../../services/inviteService';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_LABELS: Record<number, string> = {
  0: 'User',
  1: 'Member',
  2: 'Lead',
  3: 'Chief',
  4: 'Admin',
};

export const CreateUserModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [team, setTeam] = useState('');
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDoc(doc(db, 'metadata', 'teams')).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setTeams(data.teams || []);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password || !team) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await createManagedUser({ email: email.trim(), password, name: name.trim(), team });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create user. Make sure Firebase Functions are deployed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-yt-surface rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-yt-line">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-yt-line">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Create User</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-yt-hover rounded transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-yt-line rounded-lg bg-white dark:bg-yt-elevated text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-yt-line rounded-lg bg-white dark:bg-yt-elevated text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-yt-line rounded-lg bg-white dark:bg-yt-elevated text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team</label>
            <select
              value={team}
              onChange={e => setTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-yt-line rounded-lg bg-white dark:bg-yt-elevated text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a team</option>
              {teams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            New user will be created with role: <strong>{ROLE_LABELS[1]}</strong>
          </p>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-yt-line text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-yt-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

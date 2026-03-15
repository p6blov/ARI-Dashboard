import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { auth } from '../services/auth';

interface InviteData {
  email: string;
  used: boolean;
  expiresAt: any;
}

type PageState = 'loading' | 'invalid' | 'expired' | 'used' | 'form' | 'success';

export const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [teams, setTeams] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [team, setTeam] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }

    async function validate() {
      try {
        const inviteSnap = await getDoc(doc(db, 'invitations', token!));

        if (!inviteSnap.exists()) {
          setPageState('invalid');
          return;
        }

        const data = inviteSnap.data() as InviteData;

        if (data.used) {
          setPageState('used');
          return;
        }

        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (expiresAt < new Date()) {
          setPageState('expired');
          return;
        }

        setInviteData(data);

        // Load teams
        const teamsSnap = await getDoc(doc(db, 'metadata', 'teams'));
        if (teamsSnap.exists()) {
          setTeams(teamsSnap.data().teams || []);
        }

        setPageState('form');
      } catch {
        setPageState('invalid');
      }
    }

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !password || !team) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);

      // Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, inviteData!.email, password);
      const uid = cred.user.uid;

      // Create Firestore user document
      await setDoc(doc(db, 'users', uid), {
        name: name.trim(),
        email: inviteData!.email,
        role: 1,
        team,
        userID: uid,
      });

      // Mark invitation as used
      await updateDoc(doc(db, 'invitations', token!), { used: true });

      setPageState('success');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setFormError('An account with this email already exists.');
      } else {
        setFormError(err?.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" style={{ colorScheme: 'light' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ARI Dashboard</h1>
          <p className="text-gray-600">Aerospace Rocket Inventory</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {pageState === 'loading' && (
            <div className="text-center py-8">
              <p className="text-gray-500">Validating invitation...</p>
            </div>
          )}

          {pageState === 'invalid' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
              <p className="text-gray-500">This invitation link is invalid. Please contact your administrator for a new invitation.</p>
            </div>
          )}

          {pageState === 'expired' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏰</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h2>
              <p className="text-gray-500">This invitation link has expired (48 hours). Please contact your administrator for a new invitation.</p>
            </div>
          )}

          {pageState === 'used' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✓</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Used</h2>
              <p className="text-gray-500">This invitation has already been used. If you need access, please contact your administrator.</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}

          {pageState === 'success' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Created!</h2>
              <p className="text-gray-500">Your account has been created successfully. Redirecting to dashboard...</p>
            </div>
          )}

          {pageState === 'form' && inviteData && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-sm text-gray-500 mb-6">
                You've been invited to join ARI Dashboard.
              </p>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                    placeholder="Your full name"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <select
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                    required
                  >
                    <option value="">Select your team</option>
                    {teams.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

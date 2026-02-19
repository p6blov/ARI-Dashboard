import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckedOutList } from '../components/CheckedOutList';
import {
  UserProfile,
  CheckedOutItemWithDetails,
  getUserProfile,
  getCheckedOutItems,
  getItemsBatch,
} from '../services/profileService';

type ProfileTab = 'details' | 'items' | 'signout';

export const ProfileView: React.FC = () => {
  const { user, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('details');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkedOutItems, setCheckedOutItems] = useState<CheckedOutItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-memory cache for item details to avoid refetching
  const itemCache = useMemo(() => new Map(), []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile and checked out items in parallel
        const [userProfile, checkedOut] = await Promise.all([
          getUserProfile(user.uid),
          getCheckedOutItems(user.uid),
        ]);

        setProfile(userProfile);

        // If no checked out items, we're done
        if (checkedOut.length === 0) {
          setCheckedOutItems([]);
          setLoading(false);
          return;
        }

        // Extract item IDs that need to be fetched
        const itemIdsToFetch: string[] = [];
        checkedOut.forEach(item => {
          const itemId = item.itemRef?.id || item.itemId;
          if (itemId && !itemCache.has(itemId)) {
            itemIdsToFetch.push(itemId);
          }
        });

        // Fetch item details with concurrency limit (5 at a time)
        if (itemIdsToFetch.length > 0) {
          const newItems = await getItemsBatch(itemIdsToFetch, 5);
          
          // Update cache with newly fetched items
          newItems.forEach((item, id) => {
            if (item) {
              itemCache.set(id, item);
            }
          });
        }

        // Combine checked out items with their details from cache
        const itemsWithDetails: CheckedOutItemWithDetails[] = checkedOut.map(item => {
          const itemId = item.itemRef?.id || item.itemId;
          const itemDetails = itemCache.get(itemId) || null;

          return {
            ...item,
            item: itemDetails,
          };
        });

        setCheckedOutItems(itemsWithDetails);
        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchData();
  }, [user, itemCache]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logOut();
    }
  };

  const getRoleBadge = (role: number) => {
    const roles: { [key: number]: { label: string; color: string } } = {
      0: { label: 'User', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'Member', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Lead', color: 'bg-purple-100 text-purple-800' },
      3: { label: 'Manager', color: 'bg-green-100 text-green-800' },
      4: { label: 'Admin', color: 'bg-red-100 text-red-800' },
    };

    const roleData = roles[role] || roles[0];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleData.color}`}>
        {roleData.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Please sign in to view your profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-black">
        <div className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Error Loading Profile</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-black">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4">
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('details')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'details'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'items'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Items
          </button>
          <button
            onClick={() => setActiveTab('signout')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'signout'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Sign Out
          </button>
        </nav>
      </div>

      {/* Right Content Panel */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'details' && profile && (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <p className="text-lg text-gray-900 dark:text-white">{profile.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <p className="text-lg text-gray-900 dark:text-white">{profile.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team</label>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {profile.team || 'No Team'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                {getRoleBadge(profile.role)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <CheckedOutList items={checkedOutItems} loading={false} />
        )}

        {activeTab === 'signout' && (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sign Out</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <button onClick={handleSignOut} className="btn-primary">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

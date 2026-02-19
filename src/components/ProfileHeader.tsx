import React, { useState } from 'react';
import { UserProfile } from '../services/profileService';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profile.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-600">{profile.email}</p>
        </div>
        {getRoleBadge(profile.role)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {profile.team || 'No Team'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
          <div className="flex items-center space-x-2">
            <code className="text-sm bg-gray-100 px-3 py-1 rounded font-mono text-gray-800">
              {profile.uid.substring(0, 12)}...
            </code>
            <button
              onClick={copyToClipboard}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy full UID"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UsersPanel } from './manage/UsersPanel';
import { CheckoutLogsPanel } from './manage/CheckoutLogsPanel';
import { PlanogramConfigPanel } from './manage/PlanogramConfigPanel';

type ManageTab = 'users' | 'logs' | 'planogram';

export const ManageView: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ManageTab>('users');

  if (!userProfile || userProfile.role <= 2) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs: { key: ManageTab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'logs', label: 'Checkout Logs' },
    { key: 'planogram', label: 'Planogram Config' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'logs' && <CheckoutLogsPanel />}
        {activeTab === 'planogram' && <PlanogramConfigPanel />}
      </div>
    </div>
  );
};

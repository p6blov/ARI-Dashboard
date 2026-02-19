import React, { useState } from 'react';
import { Header } from '../components/Header';
import { InventoryView } from '../components/InventoryView';
import { ProfileView } from '../components/ProfileView';

type MainView = 'inventory' | 'profile';

export const MainPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<MainView>('inventory');
  
  // State to trigger actions in InventoryView
  const [triggerNewItem, setTriggerNewItem] = useState(0);
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  const [triggerCSVImport, setTriggerCSVImport] = useState(0);

  // These handlers will be called from the Header menu
  const handleNewItem = () => {
    setTriggerNewItem(prev => prev + 1);
  };

  const handleRefresh = () => {
    setTriggerRefresh(prev => prev + 1);
  };

  const handleCSVImport = () => {
    setTriggerCSVImport(prev => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-black">
      <Header 
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewItem={currentView === 'inventory' ? handleNewItem : undefined}
        onRefresh={currentView === 'inventory' ? handleRefresh : undefined}
        onCSVImport={currentView === 'inventory' ? handleCSVImport : undefined}
        isConnected={true}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'inventory' ? (
          <InventoryView 
            triggerNewItem={triggerNewItem}
            triggerRefresh={triggerRefresh}
            triggerCSVImport={triggerCSVImport}
          />
        ) : (
          <ProfileView />
        )}
      </div>
    </div>
  );
};

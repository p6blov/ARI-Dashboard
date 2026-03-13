import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { SearchBar } from '../components/SearchBar';
import { ItemsTable } from '../components/ItemsTable';
import { ItemDetailPanel } from '../components/ItemDetailPanel';
import { NewItemModal } from '../components/NewItemModal';
import { CSVImportModal } from '../components/CSVImportModal';
import { useItems } from '../hooks/useItems';
import { Item } from '../types/item';

interface InventoryViewProps {
  triggerNewItem?: number;
  triggerRefresh?: number;
  triggerCSVImport?: number;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  triggerNewItem = 0,
  triggerRefresh = 0,
  triggerCSVImport = 0,
}) => {
  const {
    items,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    availableLocations,
    availableSuppliers,
    refresh,
  } = useItems();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Respond to trigger props
  useEffect(() => {
    if (triggerNewItem > 0) {
      setIsNewItemModalOpen(true);
    }
  }, [triggerNewItem]);

  useEffect(() => {
    if (triggerRefresh > 0) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRefresh]);

  useEffect(() => {
    if (triggerCSVImport > 0) {
      setIsCSVImportOpen(true);
    }
  }, [triggerCSVImport]);

  // Reset all modal states when component unmounts (user switches views)
  useEffect(() => {
    return () => {
      setSelectedItem(null);
      setIsNewItemModalOpen(false);
      setIsCSVImportOpen(false);
    };
  }, []);

  // Keep selectedItem in sync with live Firestore data
  useEffect(() => {
    if (selectedItem) {
      const updated = items.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [items]);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  const handleCSVImportComplete = (count: number) => {
    setImportSuccessCount(count);
    refresh();
    setTimeout(() => setImportSuccessCount(null), 4000);
  };

  const handleItemCreated = (itemId: string) => {
    setIsNewItemModalOpen(false);
    // Optionally, select the newly created item
    const newItem = items.find((item) => item.id === itemId);
    if (newItem) {
      setSelectedItem(newItem);
    }
  };

  const handleUpdate = () => {
    // The real-time listener will automatically update the items
    // We just need to refresh the selected item if it's still selected
    if (selectedItem) {
      const updatedItem = items.find((item) => item.id === selectedItem.id);
      if (updatedItem) {
        setSelectedItem(updatedItem);
      } else {
        setSelectedItem(null);
      }
    }
  };

  const handleSupplierFilter = (supplierUrl: string) => {
    // Filter items by supplier URL
    updateFilters({ supplierUrl });
  };

  return (
    <>
      <div className="flex h-full overflow-hidden">
        <Sidebar
          filters={filters}
          onFilterChange={updateFilters}
          availableLocations={availableLocations}
          availableSuppliers={availableSuppliers}
          onReset={resetFilters}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="px-6 py-4 bg-white dark:bg-yt-surface border-b border-gray-200 dark:border-yt-line">
            <SearchBar
              value={filters.search}
              onChange={(value) => updateFilters({ search: value })}
            />
          </div>

          {/* Items Table */}
          <div className="flex-1 overflow-auto bg-white dark:bg-yt-surface">
            {error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Error Loading Items
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">{error}</p>
                  <button onClick={refresh} className="mt-4 btn-primary">
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <ItemsTable
                items={items}
                onItemClick={handleItemClick}
                onSupplierFilter={handleSupplierFilter}
                loading={loading}
              />
            )}
          </div>

          {/* CSV Import Success Banner */}
          {importSuccessCount !== null && (
            <div className="px-6 py-2 bg-green-50 dark:bg-green-950/40 border-t border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-300 flex items-center justify-between">
              <span>Successfully imported {importSuccessCount} items!</span>
              <button onClick={() => setImportSuccessCount(null)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium">
                ×
              </button>
            </div>
          )}

          {/* Status Bar */}
          <div className="px-6 py-2 bg-gray-50 dark:bg-yt-base border-t border-gray-200 dark:border-yt-line text-sm text-gray-600 dark:text-gray-400">
            Showing {items.length} items
            {filters.search && ` matching "${filters.search}"`}
            {(filters.locations.length > 0 ||
              filters.suppliers.length > 0 ||
              filters.lowStockOnly) &&
              ' (filtered)'}
          </div>
        </main>
      </div>

      {/* Item Detail Panel */}
      {selectedItem && (
        <ItemDetailPanel
          item={selectedItem}
          onClose={handleCloseDetail}
          onUpdate={handleUpdate}
          allItems={items}
        />
      )}

      {/* New Item Modal */}
      <NewItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        onCreated={handleItemCreated}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVImportOpen}
        onClose={() => setIsCSVImportOpen(false)}
        onComplete={handleCSVImportComplete}
      />
    </>
  );
};
import React, { useState, useMemo } from 'react';
import { CheckedOutItemWithDetails } from '../services/profileService';
import { returnItem } from '../services/returnService';
import { useAuth } from '../contexts/AuthContext';
import { ItemDetailsModal } from './ItemDetailsModal';
import { formatLocationLabel } from '../utils/helpers';

interface CheckedOutListProps {
  items: CheckedOutItemWithDetails[];
  loading: boolean;
}

export const CheckedOutList: React.FC<CheckedOutListProps> = ({ items, loading }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CheckedOutItemWithDetails | null>(null);
  const [returningItem, setReturningItem] = useState<CheckedOutItemWithDetails | null>(null);
  const [returnQty, setReturnQty] = useState(0);
  const [isReturning, setIsReturning] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const handleReturnClick = (item: CheckedOutItemWithDetails) => {
    setReturningItem(item);
    setReturnQty(item.qty);
    setReturnError(null);
  };

  const handleReturnConfirm = async () => {
    if (!returningItem || !user) return;
    try {
      setIsReturning(true);
      setReturnError(null);
      await returnItem(user.uid, returningItem.itemId, returnQty);
      setReturningItem(null);
      window.location.reload();
    } catch (error) {
      setReturnError((error as Error).message);
    } finally {
      setIsReturning(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.item?.name.toLowerCase().includes(query) ||
      item.item?.description.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const totalItems = filteredItems.length;
  const totalQty = filteredItems.reduce((sum, item) => sum + item.qty, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Checked Out Items</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Checked Out Items</h2>
        {totalItems > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{totalItems}</span> items ·{' '}
            <span className="font-medium ml-1">{totalQty}</span> total qty
          </div>
        )}
      </div>

      {/* Search */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="input-field pl-10"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No items checked out</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You haven't checked out any items yet.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No items match your search</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((checkedOutItem) => {
            const item = checkedOutItem.item;
            if (!item) {
              return (
                <div key={checkedOutItem.itemId} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-300">Item not found</p>
                    <p className="text-xs text-red-700 dark:text-red-400">ID: {checkedOutItem.itemId}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                    Qty: {checkedOutItem.qty}
                  </span>
                </div>
              );
            }

            const locLabel = item.location.length > 0
              ? (Array.isArray(item.location[0])
                  ? formatLocationLabel(item.location[0] as any)
                  : item.location[0])
              : null;

            return (
              <div
                key={checkedOutItem.itemId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => setSelectedItem(checkedOutItem)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {locLabel && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        📍 {locLabel}
                        {item.location.length > 1 && ` +${item.location.length - 1}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 ml-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    Qty: {checkedOutItem.qty}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReturnClick(checkedOutItem); }}
                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                  >
                    Return
                  </button>
                  <button
                    onClick={() => setSelectedItem(checkedOutItem)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && selectedItem.item && (
        <ItemDetailsModal
          item={selectedItem.item}
          qtyCheckedOut={selectedItem.qty}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Return Modal */}
      {returningItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Return Item</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {returningItem.item?.name || 'Item'}
            </p>

            {returnError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {returnError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity to Return
              </label>
              <input
                type="number"
                min="1"
                max={returningItem.qty}
                value={returnQty}
                onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
                className="input-field"
                disabled={isReturning}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You have {returningItem.qty} checked out
              </p>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setReturningItem(null)} className="flex-1 btn-secondary" disabled={isReturning}>
                Cancel
              </button>
              <button
                onClick={handleReturnConfirm}
                disabled={isReturning || returnQty <= 0 || returnQty > returningItem.qty}
                className="flex-1 btn-primary"
              >
                {isReturning ? 'Returning...' : 'Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

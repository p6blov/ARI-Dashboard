import React from 'react';
import { Item } from '../types/item';
import { formatPrice, formatLocationLabel } from '../utils/helpers';

interface ItemDetailsModalProps {
  item: Item;
  qtyCheckedOut: number;
  onClose: () => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  qtyCheckedOut,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Item Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-gray-950">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
          </div>

          {/* Checked Out Quantity */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              Quantity You Have Checked Out
            </label>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{qtyCheckedOut}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <p className="text-gray-700 dark:text-gray-300">{item.description || 'N/A'}</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <div className="flex flex-wrap gap-2">
              {item.location.length > 0 ? (
                item.location.map((loc, idx) => {
                  const label = Array.isArray(loc) ? formatLocationLabel(loc as any) : loc;
                  return (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                      {label}
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-500 dark:text-gray-400">N/A</span>
              )}
            </div>
          </div>

          {/* Inventory Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">On Hand</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {item.on_hand !== undefined ? item.on_hand : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Quantity</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {item.quantity !== undefined ? item.quantity : 'N/A'}
              </p>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
            <p className="text-gray-700 dark:text-gray-300">{item.supplier || 'N/A'}</p>
          </div>

          {/* Retail Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retail Price</label>
            <p className="text-gray-900 dark:text-gray-100 font-medium">{formatPrice(item.retail_price)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-black">
          <button onClick={onClose} className="w-full btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

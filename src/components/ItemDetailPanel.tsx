import React, { useState, useEffect } from 'react';
import { Item, ItemPatch } from '../types/item';
import { itemsRepository } from '../services/itemsRepository';
import { checkoutItem } from '../services/checkoutService';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, formatDate, toInputDateFormat, toStorageDateFormat, formatLocationLabel } from '../utils/helpers';
import { LocationPicker } from './LocationPicker';
import { BarcodeModal } from './BarcodeModal';

interface ItemDetailPanelProps {
  item: Item;
  onClose: () => void;
  onUpdate: () => void;
}

export const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({
  item,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<Item>(item);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);

  useEffect(() => {
    setEditedItem({
      ...item,
      on_hand: item.on_hand ?? 0,
      quantity: item.quantity ?? 0,
      retail_price: item.retail_price ?? 0,
      count_date: item.count_date || '',
      count_person: item.count_person || '',
      delivery_date: item.delivery_date || '',
    });
    setIsEditing(false);
    setError(null);
  }, [item]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const patch: ItemPatch = {
        name: editedItem.name,
        description: editedItem.description,
        supplier: editedItem.supplier,
        location: editedItem.location,
        on_hand: editedItem.on_hand,
        quantity: editedItem.quantity,
        retail_price: editedItem.retail_price,
        count_date: toStorageDateFormat(editedItem.count_date),
        count_person: editedItem.count_person,
        delivery_date: toStorageDateFormat(editedItem.delivery_date),
      };

      await itemsRepository.updateItem(item.id, patch);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      setIsSaving(true);
      await itemsRepository.deleteItem(item.id);
      onClose();
    } catch (err) {
      setError('Failed to delete item');
      setIsSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setError('You must be signed in to check out items');
      return;
    }
    if (checkoutQty <= 0) {
      setError('Checkout quantity must be greater than 0');
      return;
    }
    const availableQty = editedItem.on_hand ?? 0;
    if (checkoutQty > availableQty) {
      setError(`Only ${availableQty} available in stock`);
      return;
    }
    try {
      setIsCheckingOut(true);
      setError(null);
      await checkoutItem(user.uid, item.id, checkoutQty);
      const newOnHand = (item.on_hand ?? 0) - checkoutQty;
      setEditedItem(prev => ({ ...prev, on_hand: newOnHand }));
      setCheckoutSuccess(true);
      setCheckoutQty(1);
      setTimeout(() => {
        setCheckoutSuccess(false);
        onUpdate();
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const removeLocation = (index: number) => {
    setEditedItem({
      ...editedItem,
      location: editedItem.location.filter((_, i) => i !== index),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditing) handleCancel();
      else onClose();
    } else if (e.key === 'Enter' && e.ctrlKey && isEditing) {
      handleSave();
    }
  };

  // Render a location entry — handles both ["cab1","row2","col3"] and legacy "cab1-row2-col3"
  const renderLocationTag = (loc: any, idx: number, removable = false) => {
    const label = Array.isArray(loc) ? formatLocationLabel(loc) : loc;
    return (
      <span
        key={idx}
        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200"
      >
        {label}
        {removable && (
          <button
            onClick={() => removeLocation(idx)}
            className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
          >
            ×
          </button>
        )}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-gray-950 shadow-xl z-50 overflow-hidden flex flex-col"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Item Details</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBarcode(true)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="View Barcode"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            {isEditing ? (
              <input
                type="text"
                value={editedItem.name}
                onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                className="input-field"
                required
              />
            ) : (
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            {isEditing ? (
              <textarea
                value={editedItem.description}
                onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                rows={3}
                className="input-field"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{item.description || 'N/A'}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
            {isEditing ? (
              <div className="space-y-2">
                <LocationPicker
                  onLocationAdd={(locArr) => {
                    setEditedItem({
                      ...editedItem,
                      location: [...editedItem.location, locArr as any],
                    });
                  }}
                  existingLocations={editedItem.location as any}
                />
                <div className="flex flex-wrap gap-2">
                  {editedItem.location.map((loc, idx) => renderLocationTag(loc, idx, true))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {item.location.length > 0 ? (
                  item.location.map((loc, idx) => renderLocationTag(loc, idx))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">N/A</span>
                )}
              </div>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
            {isEditing ? (
              <input
                type="text"
                value={editedItem.supplier}
                onChange={(e) => setEditedItem({ ...editedItem, supplier: e.target.value })}
                className="input-field"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{item.supplier || 'N/A'}</p>
            )}
          </div>

          {/* Inventory Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">On Hand</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={editedItem.on_hand ?? 0}
                  onChange={(e) => setEditedItem({ ...editedItem, on_hand: e.target.value ? parseInt(e.target.value) : 0 })}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{item.on_hand !== undefined ? item.on_hand : 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={editedItem.quantity ?? 0}
                  onChange={(e) => setEditedItem({ ...editedItem, quantity: e.target.value ? parseInt(e.target.value) : 0 })}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{item.quantity !== undefined ? item.quantity : 'N/A'}</p>
              )}
            </div>
          </div>

          {/* Retail Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retail Price</label>
            {isEditing ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={editedItem.retail_price ?? 0}
                onChange={(e) => setEditedItem({ ...editedItem, retail_price: e.target.value ? parseFloat(e.target.value) : 0 })}
                className="input-field"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{formatPrice(item.retail_price)}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Count Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={toInputDateFormat(editedItem.count_date)}
                  onChange={(e) => setEditedItem({ ...editedItem, count_date: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{formatDate(item.count_date)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={toInputDateFormat(editedItem.delivery_date)}
                  onChange={(e) => setEditedItem({ ...editedItem, delivery_date: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{formatDate(item.delivery_date)}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Count Person</label>
            {isEditing ? (
              <input
                type="text"
                value={editedItem.count_person}
                onChange={(e) => setEditedItem({ ...editedItem, count_person: e.target.value })}
                className="input-field"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{item.count_person || 'N/A'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Section */}
      {!isEditing && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-blue-50 dark:bg-blue-950/30">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Check Out Item</h3>
          {checkoutSuccess ? (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 text-green-800 dark:text-green-300 text-sm">
              ✓ Successfully checked out {checkoutQty} item(s)!
            </div>
          ) : (
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={editedItem.on_hand ?? 0}
                  value={checkoutQty}
                  onChange={(e) => setCheckoutQty(parseInt(e.target.value) || 1)}
                  className="input-field"
                  disabled={isCheckingOut}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Available: {editedItem.on_hand ?? 0}
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || (editedItem.on_hand ?? 0) <= 0}
                className="btn-primary"
              >
                {isCheckingOut ? 'Checking out...' : 'Check Out'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-black">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="btn-secondary" disabled={isSaving}>Cancel</button>
              <button onClick={handleSave} className="btn-primary" disabled={isSaving || !editedItem.name.trim()}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                disabled={isSaving}
              >
                Delete
              </button>
              <button onClick={() => setIsEditing(true)} className="btn-primary">Edit</button>
            </>
          )}
        </div>
        {isEditing && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Press Esc to cancel, Ctrl+Enter to save
          </p>
        )}
      </div>

      {showBarcode && (
        <BarcodeModal
          itemId={item.id}
          itemName={item.name}
          isOpen={showBarcode}
          onClose={() => setShowBarcode(false)}
        />
      )}
    </div>
  );
};

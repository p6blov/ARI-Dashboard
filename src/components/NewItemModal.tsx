import React, { useState } from 'react';
import { ItemDraft } from '../types/item';
import { itemsRepository } from '../services/itemsRepository';
import { toStorageDateFormat, formatLocationLabel } from '../utils/helpers';
import { LocationPicker } from './LocationPicker';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (itemId: string) => void;
}

const initialFormState = {
  name: '',
  description: '',
  supplier: '',
  locations: [] as string[][], // each entry is ["cab1","row2","col3"]
  on_hand: undefined as number | undefined,
  quantity: undefined as number | undefined,
  retail_price: undefined as number | undefined,
  count_date: '',
  count_person: '',
  delivery_date: '',
};

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const itemToCreate: ItemDraft = {
        name: formData.name,
        description: formData.description,
        supplier: formData.supplier,
        // Store locations as array of 3-element arrays; Firestore handles nested arrays
        location: formData.locations as any,
        on_hand: formData.on_hand,
        quantity: formData.quantity,
        retail_price: formData.retail_price,
        count_date: toStorageDateFormat(formData.count_date),
        delivery_date: toStorageDateFormat(formData.delivery_date),
        count_person: formData.count_person,
      };

      const newItem = await itemsRepository.createItem(itemToCreate);
      setFormData(initialFormState);
      onCreated(newItem.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormState);
      setError(null);
      onClose();
    }
  };

  const removeLocation = (index: number) => {
    setFormData({
      ...formData,
      locations: formData.locations.filter((_, i) => i !== index),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Item</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isSubmitting}
            title="Close (Esc)"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="input-field"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="input-field"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
              <LocationPicker
                onLocationAdd={(locArr) => {
                  setFormData({
                    ...formData,
                    locations: [...formData.locations, locArr],
                  });
                }}
                existingLocations={formData.locations}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.locations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200"
                  >
                    {formatLocationLabel(loc)}
                    <button
                      type="button"
                      onClick={() => removeLocation(idx)}
                      className="ml-2 hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Inventory Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">On Hand</label>
                <input
                  type="number"
                  min="0"
                  value={formData.on_hand ?? ''}
                  onChange={(e) => setFormData({ ...formData, on_hand: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity ?? ''}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Retail Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retail Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.retail_price ?? ''}
                onChange={(e) => setFormData({ ...formData, retail_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="input-field"
                placeholder="0.00"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Count Date</label>
                <input
                  type="date"
                  value={formData.count_date}
                  onChange={(e) => setFormData({ ...formData, count_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Count Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Count Person</label>
              <input
                type="text"
                value={formData.count_person}
                onChange={(e) => setFormData({ ...formData, count_person: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-black flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

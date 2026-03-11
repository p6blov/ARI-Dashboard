import React, { useState, useEffect } from 'react';
import { ItemDraft } from '../types/item';
import { itemsRepository } from '../services/itemsRepository';
import { toStorageDateFormat } from '../utils/helpers';
import { LocationPicker } from './LocationPicker';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (itemId: string) => void;
}

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ItemDraft>({
    name: '',
    description: '',
    supplier: '',
    location: [],
    on_hand: undefined,
    quantity: undefined,
    retail_price: undefined,
    count_date: getTodayDate(),
    count_person: '',
    delivery_date: getTodayDate(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Fetch user's name from Firestore
  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const name = userData.name || userData.email || 'Unknown';
            setUserName(name);
            setFormData(prev => ({ ...prev, count_person: name }));
          }
        } catch (err) {
          console.error('Error fetching user name:', err);
          setUserName(user.email || 'Unknown');
          setFormData(prev => ({ ...prev, count_person: user.email || 'Unknown' }));
        }
      }
    };
    
    if (isOpen) {
      fetchUserName();
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert dates to MM-DD-YYYY format for consistency with iOS app
      const itemToCreate = {
        ...formData,
        count_date: toStorageDateFormat(formData.count_date),
        delivery_date: toStorageDateFormat(formData.delivery_date),
      };
      
      const { id: itemId } = await itemsRepository.createItem(itemToCreate);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        supplier: '',
        location: [],
        on_hand: undefined,
        quantity: undefined,
        retail_price: undefined,
        count_date: getTodayDate(),
        count_person: userName,
        delivery_date: getTodayDate(),
      });
      
      onCreated(itemId);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      supplier: '',
      location: [],
      on_hand: undefined,
      quantity: undefined,
      retail_price: undefined,
      count_date: getTodayDate(),
      count_person: userName,
      delivery_date: getTodayDate(),
    });
    setError(null);
    onClose();
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Item</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="input-field"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <LocationPicker
                onLocationAdd={(cab, row, col) => {
                  // Add as flat array: ["cab1", "row2", "col3"]
                  setFormData({
                    ...formData,
                    location: [...formData.location, `cab${cab}`, `row${row}`, `col${col}`],
                  });
                }}
                existingLocations={formData.location}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.location.length > 0 && formData.location.length % 3 === 0 && (
                  // Display locations in groups of 3
                  Array.from({ length: formData.location.length / 3 }).map((_, groupIdx) => {
                    const startIdx = groupIdx * 3;
                    const locGroup = formData.location.slice(startIdx, startIdx + 3);
                    return (
                      <span
                        key={groupIdx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200"
                      >
                        {locGroup.join(' ')}
                        <button
                          type="button"
                          onClick={() => {
                            // Remove all 3 elements of this location group
                            const newLocations = [...formData.location];
                            newLocations.splice(startIdx, 3);
                            setFormData({ ...formData, location: newLocations });
                          }}
                          className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="input-field"
              />
            </div>

            {/* Inventory Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  On Hand
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.on_hand ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    on_hand: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    quantity: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Retail Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Retail Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.retail_price ?? ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  retail_price: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                className="input-field"
              />
            </div>

            {/* Dates - Auto-set to today */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Count Date
                </label>
                <input
                  type="date"
                  value={formData.count_date}
                  onChange={(e) => setFormData({ ...formData, count_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Count Person - Auto-filled, read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Count Person (Auto-filled)
              </label>
              <input
                type="text"
                value={formData.count_person}
                className="input-field bg-gray-100 dark:bg-gray-900 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-black flex items-center justify-between">
          <button
            onClick={handleClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
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
import React, { useState } from 'react';
import { FilterState } from '../hooks/useItems';

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  availableLocations: string[];
  availableSuppliers: string[];
  onReset: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  onFilterChange,
  availableLocations,
  availableSuppliers,
  onReset,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleLocation = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter((l) => l !== location)
      : [...filters.locations, location];
    onFilterChange({ locations: newLocations });
  };

  const toggleSupplier = (supplier: string) => {
    const newSuppliers = filters.suppliers.includes(supplier)
      ? filters.suppliers.filter((s) => s !== supplier)
      : [...filters.suppliers, supplier];
    onFilterChange({ suppliers: newSuppliers });
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Expand filters"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Collapse sidebar"
        >
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Location Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableLocations.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">No locations available</p>
            ) : (
              availableLocations.map((location) => (
                <label
                  key={location}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.locations.includes(location)}
                    onChange={() => toggleLocation(location)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{location}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Supplier Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableSuppliers.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">No suppliers available</p>
            ) : (
              availableSuppliers.map((supplier) => (
                <label
                  key={supplier}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.suppliers.includes(supplier)}
                    onChange={() => toggleSupplier(supplier)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{supplier}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Filter */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.lowStockOnly}
              onChange={(e) =>
                onFilterChange({ lowStockOnly: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Low Stock Only
            </span>
          </label>
          {filters.lowStockOnly && (
            <div className="mt-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Threshold: {filters.lowStockThreshold}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.lowStockThreshold}
                onChange={(e) =>
                  onFilterChange({
                    lowStockThreshold: parseInt(e.target.value),
                  })
                }
                className="w-full mt-1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button onClick={onReset} className="w-full btn-secondary text-sm dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
          Reset Filters
        </button>
      </div>
    </aside>
  );
};

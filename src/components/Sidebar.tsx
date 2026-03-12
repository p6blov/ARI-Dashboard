import React, { useState } from 'react';
import { FilterState } from '../hooks/useItems';
import { getSupplierNameFromUrl } from '../utils/helpers';

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  availableLocations: string[];
  availableSuppliers: string[];
  onReset: () => void;
}

const CABINETS = [1, 2, 3, 4, 5];

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  onFilterChange,
  availableSuppliers,
  onReset,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCabinet = (cabinet: number) => {
    const key = `cab${cabinet}`;
    const newLocations = filters.locations.includes(key)
      ? filters.locations.filter((l) => l !== key)
      : [...filters.locations, key];
    onFilterChange({ locations: newLocations });
  };

  const isCabinetChecked = (cabinet: number) =>
    filters.locations.includes(`cab${cabinet}`);

  // Deduplicate suppliers by resolved company name
  const uniqueSuppliersByName = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const supplier of availableSuppliers) {
      const name = getSupplierNameFromUrl(supplier);
      if (!seen.has(name)) seen.set(name, supplier);
    }
    return Array.from(seen.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableSuppliers]);

  const isSupplierChecked = (companyName: string) =>
    filters.suppliers.some((s) => getSupplierNameFromUrl(s) === companyName);

  const toggleSupplier = (companyName: string) => {
    if (isSupplierChecked(companyName)) {
      onFilterChange({
        suppliers: filters.suppliers.filter(
          (s) => getSupplierNameFromUrl(s) !== companyName
        ),
      });
    } else {
      const toAdd = availableSuppliers.filter(
        (s) => getSupplierNameFromUrl(s) === companyName
      );
      onFilterChange({ suppliers: [...filters.suppliers, ...toAdd] });
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Expand filters"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Cabinet Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cabinet</h3>
          <div className="space-y-2">
            {CABINETS.map((cabinet) => (
              <label
                key={cabinet}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={isCabinetChecked(cabinet)}
                  onChange={() => toggleCabinet(cabinet)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Cabinet {cabinet}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Supplier Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uniqueSuppliersByName.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">No suppliers available</p>
            ) : (
              uniqueSuppliersByName.map(({ name }) => (
                <label
                  key={name}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={isSupplierChecked(name)}
                    onChange={() => toggleSupplier(name)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
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
              onChange={(e) => onFilterChange({ lowStockOnly: e.target.checked })}
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
                onChange={(e) => onFilterChange({ lowStockThreshold: parseInt(e.target.value) })}
                className="w-full mt-1"
              />
            </div>
          )}
        </div>

      </div>

      {/* Reset Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onReset}
          className="w-full btn-secondary text-sm dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Reset Filters
        </button>
      </div>
    </aside>
  );
};
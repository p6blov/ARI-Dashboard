import React, { useState } from 'react';
import { Item } from '../types/item';
import { formatDate, getSupplierNameFromUrl } from '../utils/helpers';
import { PlanogramModal } from './PlanogramModal';
import { ItemDetailsModal } from './ItemDetailsModal';
import { useCabinetConfig } from '../hooks/useCabinetConfig';
import { CabinetConfig } from '../services/cabinetService';

function getCabinetDisplay(cabinetKey: string, config: CabinetConfig | null): string {
  if (!config || !config[cabinetKey]) return cabinetKey;
  return config[cabinetKey].label;
}

interface ItemsTableProps {
  items: Item[];
  onItemClick: (item: Item) => void;
  onSupplierFilter?: (supplierUrl: string) => void;
  loading?: boolean;
}

type SortField = 'name' | 'on_hand';
type SortDirection = 'asc' | 'desc';

// Returns Tailwind color classes based on on_hand / quantity ratio:
// green  = on_hand > 60% of quantity
// yellow = on_hand > 15% of quantity
// red    = on_hand <= 15% of quantity
// Falls back to yellow if quantity is undefined/zero (can't compute ratio)
const getStockColor = (on_hand: number, quantity?: number) => {
  if (!quantity || quantity === 0) {
    // No quantity to compare against — use absolute fallback
    return on_hand === 0
      ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200'
      : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200';
  }

  const ratio = on_hand / quantity;

  if (ratio > 0.6) return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200';
  if (ratio > 0.15) return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200';
  return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200';
};

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  onItemClick,
  onSupplierFilter,
  loading = false,
}) => {
  const cabinetConfig = useCabinetConfig();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [showPlanogram, setShowPlanogram] = useState(false);
  const [selectedCabinet, _setSelectedCabinet] = useState(1);
  const [planogramSelectedItem, setPlanogramSelectedItem] = useState<Item | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    if (sortField === 'on_hand') {
      aValue = a.on_hand ?? 0;
      bValue = b.on_hand ?? 0;
    } else {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field && sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading items...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-lg">No items found</p>
        <p className="text-sm">Try adjusting your filters or add a new item</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-yt-line">
          <thead className="bg-gray-50 dark:bg-yt-base">
            <tr>
              <th onClick={() => handleSort('name')} className="table-header">
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th onClick={() => handleSort('on_hand')} className="table-header">
                <div className="flex items-center space-x-1">
                  <span>On Hand</span>
                  <SortIcon field="on_hand" />
                </div>
              </th>
              <th className="table-header">Quantity</th>
              <th className="table-header">Location</th>
              <th className="table-header">Position</th>
              <th className="table-header">Supplier</th>
              <th className="table-header">Updated</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-yt-surface divide-y divide-gray-200 dark:divide-yt-line">
            {sortedItems.map((item) => {
              const cabinetKey = item.location?.[0];
              const cabinet    = cabinetKey ? getCabinetDisplay(cabinetKey, cabinetConfig) : undefined;
              const row        = item.location?.[1]?.replace(/\D/g, '');
              const col        = item.location?.[2]?.replace(/\D/g, '');

              return (
                <tr
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="hover:bg-gray-50 dark:hover:bg-yt-base cursor-pointer transition-colors"
                >
                  <td className="table-cell font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="table-cell">
                    {item.on_hand !== undefined ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockColor(item.on_hand, item.quantity)}`}>
                        {item.on_hand}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">N/A</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {item.quantity !== undefined ? item.quantity : 'N/A'}
                  </td>

                  {/* Cabinet */}
                  <td className="table-cell">
                    {cabinet ? (
                      <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 rounded text-xs font-semibold">
                        {cabinet}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </td>

                  {/* Location */}
                  <td className="table-cell">
                    {row && col ? (
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Row: {row}<br />Col: {col}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </td>

                  <td className="table-cell">
                    {item.supplier_url ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSupplierFilter) onSupplierFilter(item.supplier_url!);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {getSupplierNameFromUrl(item.supplier_url)}
                      </button>
                    ) : item.supplier ? (
                      <span className="text-gray-700 dark:text-gray-300">
                        {getSupplierNameFromUrl(item.supplier)}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">N/A</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-500 dark:text-gray-400">
                    {formatDate(item.count_date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Planogram Modal */}
      {showPlanogram && (
        <PlanogramModal
          cabinet={selectedCabinet}
          items={items}
          isOpen={showPlanogram}
          onClose={() => setShowPlanogram(false)}
          onItemSelect={(item) => {
            setShowPlanogram(false);
            setPlanogramSelectedItem(item);
          }}
        />
      )}

      {/* ItemDetailsModal opened from planogram */}
      {planogramSelectedItem && (
        <ItemDetailsModal
          item={planogramSelectedItem}
          qtyCheckedOut={0}
          onClose={() => setPlanogramSelectedItem(null)}
        />
      )}
    </>
  );
};
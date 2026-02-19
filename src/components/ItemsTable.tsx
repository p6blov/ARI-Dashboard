import React, { useState } from 'react';
import { Item } from '../types/item';
import { formatDate, getSupplierNameFromUrl, getLocationDisplay } from '../utils/helpers';

interface ItemsTableProps {
  items: Item[];
  onItemClick: (item: Item) => void;
  onSupplierFilter?: (supplierUrl: string) => void;
  loading?: boolean;
}

type SortField = 'name' | 'on_hand';
type SortDirection = 'asc' | 'desc';

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  onItemClick,
  onSupplierFilter,
  loading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    if (sortField === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else {
      aVal = a.on_hand ?? -1;
      bVal = b.on_hand ?? -1;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-black">
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
            <th className="table-header">Cabinet</th>
            <th className="table-header">Location</th>
            <th className="table-header">Supplier</th>
            <th className="table-header">Updated</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedItems.map((item) => {
            // Parse location from the 3-element array
            const locDisplay = item.location && item.location.length > 0
              ? getLocationDisplay(item.location as any)
              : null;

            return (
              <tr
                key={item.id}
                onClick={() => onItemClick(item)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <td className="table-cell font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </td>
                <td className="table-cell">
                  {item.on_hand !== undefined ? (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.on_hand < 10
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : item.on_hand < 20
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {item.on_hand}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">N/A</span>
                  )}
                </td>
                <td className="table-cell text-gray-700 dark:text-gray-300">
                  {item.quantity !== undefined ? item.quantity : 'N/A'}
                </td>

                {/* Cabinet # only */}
                <td className="table-cell">
                  {locDisplay ? (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {locDisplay.cabinet}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">-</span>
                  )}
                </td>

                {/* Location: Row + Column stacked */}
                <td className="table-cell">
                  {locDisplay ? (
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-tight">
                      <div>Row {locDisplay.row}</div>
                      <div className="text-gray-500 dark:text-gray-400">Col {locDisplay.col}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">-</span>
                  )}
                </td>

                <td className="table-cell">
                  {item.supplier_url ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSupplierFilter) {
                          onSupplierFilter(item.supplier_url!);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                    >
                      {getSupplierNameFromUrl(item.supplier_url)}
                    </button>
                  ) : item.supplier ? (
                    <span className="text-gray-700 dark:text-gray-300">{item.supplier}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">N/A</span>
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
  );
};

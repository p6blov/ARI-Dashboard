import React, { useMemo } from 'react';
import { Item } from '../types/item';
import { parseLocation } from '../utils/helpers';

interface PlanogramModalProps {
  cabinet: number;
  row: number;
  col: number;
  allItems: Item[];
  isOpen: boolean;
  onClose: () => void;
}

export const PlanogramModal: React.FC<PlanogramModalProps> = ({
  cabinet,
  row,
  col,
  allItems,
  isOpen,
  onClose,
}) => {
  // Get items in this specific location
  const itemsInLocation = useMemo(() => {
    const locationStr = `cab${cabinet}-row${row}-col${col}`;
    return allItems.filter((item) =>
      item.location.some((loc) => loc.toLowerCase() === locationStr.toLowerCase())
    );
  }, [cabinet, row, col, allItems]);

  // Create planogram grid for the cabinet (6 rows x 4 cols)
  const planogramGrid = useMemo(() => {
    const grid: { [key: string]: Item[] } = {};

    // Initialize all cells
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 4; c++) {
        const key = `${r}-${c}`;
        grid[key] = [];
      }
    }

    // Fill with items from this cabinet
    allItems.forEach((item) => {
      item.location.forEach((locStr) => {
        const parsed = parseLocation(locStr);
        if (parsed && parsed.cabinet === cabinet) {
          const key = `${parsed.row}-${parsed.col}`;
          if (grid[key]) {
            grid[key].push(item);
          }
        }
      });
    });

    return grid;
  }, [cabinet, allItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cabinet {cabinet} Planogram
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Selected: Row {row}, Column {col} ({itemsInLocation.length} item{itemsInLocation.length !== 1 ? 's' : ''})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Planogram Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6].map((r) =>
              [1, 2, 3, 4].map((c) => {
                const key = `${r}-${c}`;
                const items = planogramGrid[key] || [];
                const isSelected = r === row && c === col;

                return (
                  <div
                    key={key}
                    className={`
                      aspect-square border-2 rounded-lg p-2 flex flex-col items-center justify-center
                      transition-all cursor-pointer hover:border-blue-500
                      ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50'
                          : items.length > 0
                          ? 'border-gray-400 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                          : 'border-gray-300 dark:border-gray-800 bg-white dark:bg-black'
                      }
                    `}
                  >
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      R{r} C{c}
                    </div>
                    {items.length > 0 && (
                      <div className="text-center w-full">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {items[0].name}
                        </div>
                        {items.length > 1 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            +{items.length - 1} more
                          </div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Qty: {items.reduce((sum, item) => sum + (item.on_hand || 0), 0)}
                        </div>
                      </div>
                    )}
                    {items.length === 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-600">Empty</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Items in Selected Location */}
        {itemsInLocation.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-black">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Items at Row {row}, Column {col}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {itemsInLocation.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-950 rounded border border-gray-200 dark:border-gray-800"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {item.description || 'No description'}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Qty: {item.on_hand || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

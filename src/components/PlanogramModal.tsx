import React, { useMemo } from 'react';
import { Item } from '../types/item';

interface PlanogramModalProps {
  cabinet: number;
  items: Item[];
  isOpen: boolean;
  onClose: () => void;
}

export const PlanogramModal: React.FC<PlanogramModalProps> = ({
  cabinet,
  items,
  isOpen,
  onClose,
}) => {
  // Build grid from items
  // location is a flat array: ['cab1', 'row2', 'col3']
  // Extract numbers by stripping non-digit characters
  const { grid, itemsInCabinet } = useMemo(() => {
    const gridData: { [key: string]: Item[] } = {};
    const cabinetItems: Item[] = [];

    // Initialize all cells as empty
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 4; c++) {
        gridData[`${r}-${c}`] = [];
      }
    }

    items.forEach((item) => {
      const loc = item.location;
      if (!loc || loc.length < 3) return;

      const itemCabinet = Number(loc[0].replace(/\D/g, ''));
      const itemRow     = Number(loc[1].replace(/\D/g, ''));
      const itemCol     = Number(loc[2].replace(/\D/g, ''));

      if (itemCabinet !== cabinet) return;

      cabinetItems.push(item);

      const key = `${itemRow}-${itemCol}`;
      if (gridData[key]) {
        gridData[key].push(item);
      }
    });

    return { grid: gridData, itemsInCabinet: cabinetItems };
  }, [cabinet, items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-950 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-cyan-500/20">
        {/* Header */}
        <div className="relative px-8 py-6 border-b border-gray-200 dark:border-cyan-500/30 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950 dark:to-black">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent dark:via-cyan-500/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <span className="text-2xl font-bold text-white">{cabinet}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Cabinet {cabinet}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-cyan-400/80">
                    {itemsInCabinet.length} item{itemsInCabinet.length !== 1 ? 's' : ''} stored • 6 rows × 4 columns
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-cyan-500/10 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-cyan-400 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-black">
          <div className="grid grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((row) =>
              [1, 2, 3, 4].map((col) => {
                const key = `${row}-${col}`;
                const cellItems = grid[key] || [];
                const hasItems = cellItems.length > 0;

                return (
                  <div
                    key={key}
                    className={`
                      aspect-square rounded-xl transition-all duration-300 relative overflow-hidden group
                      ${hasItems
                        ? 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-2 border-cyan-200 dark:border-cyan-500/40 shadow-lg hover:shadow-cyan-500/50 dark:shadow-cyan-500/20'
                        : 'bg-transparent border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-cyan-300 dark:hover:border-cyan-500/30'
                      }
                      hover:scale-105 cursor-pointer
                    `}
                  >
                    {/* Grid Coordinates */}
                    <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded ${
                      hasItems
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      R{row}C{col}
                    </div>

                    {/* Corner Accents */}
                    {hasItems && (
                      <>
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 dark:border-cyan-500" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 dark:border-cyan-500" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 dark:border-cyan-500" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 dark:border-cyan-500" />
                      </>
                    )}

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                      {hasItems ? (
                        <>
                          <div className="text-center w-full mb-2">
                            <div className="text-sm font-bold text-gray-900 dark:text-white truncate px-2">
                              {cellItems[0].name}
                            </div>
                            {cellItems.length > 1 && (
                              <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-1">
                                +{cellItems.length - 1} more
                              </div>
                            )}
                          </div>
                          <div className="mt-auto">
                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold shadow-lg">
                              Qty: {cellItems.reduce((sum, i) => sum + (i.on_hand || 0), 0)}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-600 font-medium">
                          Empty
                        </div>
                      )}
                    </div>

                    {/* Hover Glow */}
                    {hasItems && (
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-cyan-400/0 to-blue-400/0 group-hover:from-cyan-400/10 group-hover:via-blue-400/10 group-hover:to-cyan-400/10 transition-all duration-300" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Items List */}
        {itemsInCabinet.length > 0 && (
          <div className="border-t border-gray-200 dark:border-cyan-500/30 bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:to-black p-6 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 dark:text-cyan-400 mb-4 uppercase tracking-wider">
              All Items in Cabinet {cabinet}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {itemsInCabinet.map((item) => {
                const row = item.location[1]?.replace(/\D/g, '');
                const col = item.location[2]?.replace(/\D/g, '');

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-cyan-950/20 rounded-lg border border-gray-200 dark:border-cyan-500/30 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-cyan-400/70 mt-1">
                        R{row}C{col}
                      </div>
                    </div>
                    <div className="ml-3 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold">
                      {item.on_hand || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
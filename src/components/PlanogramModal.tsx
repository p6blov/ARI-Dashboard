import React, { useMemo } from 'react';
import { Item } from '../types/item';

interface PlanogramModalProps {
  cabinet: number;
  items: Item[];
  isOpen: boolean;
  onItemSelect: (item: Item) => void
  onClose: () => void;
}

export const PlanogramModal: React.FC<PlanogramModalProps> = ({
  cabinet,
  items,
  isOpen,
  onItemSelect,
  onClose,
}) => {
  const { grid, itemsInCabinet } = useMemo(() => {
    const gridData: { [key: string]: Item[] } = {};
    const cabinetItems: Item[] = [];

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
      if (gridData[key]) gridData[key].push(item);
    });

    return { grid: gridData, itemsInCabinet: cabinetItems };
  }, [cabinet, items]);

  const handleItemClick = (item: Item) => {
    // onClose();
    onItemSelect(item);
  };

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-yt-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-yt-line">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-yt-line bg-gray-50 dark:bg-yt-base">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Cabinet {cabinet}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {itemsInCabinet.length} item{itemsInCabinet.length !== 1 ? 's' : ''} · 6 rows × 4 cols
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-yt-hover rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">

              {/* Left Column — Item List */}
              <div className="w-52 shrink-0 border-r border-gray-200 dark:border-yt-line overflow-y-auto bg-gray-50 dark:bg-yt-base">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-yt-line">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </span>
                </div>
                {itemsInCabinet.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-gray-400 dark:text-gray-600">
                    No items in this cabinet
                  </p>
                ) : (
                  itemsInCabinet.map((item) => {
                    const row = item.location[1]?.replace(/\D/g, '');
                    const col = item.location[2]?.replace(/\D/g, '');
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full text-left px-3 py-2 border-b border-gray-100 dark:border-yt-line hover:bg-gray-100 dark:hover:bg-yt-elevated transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          R{row}C{col} · Qty: {item.on_hand ?? 0}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Center — Planogram Grid */}
              <div className="flex-1 overflow-auto p-5 flex justify-start items-start">
                <div>
                  {/* Column headers */}
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3, 4].map((col) => (
                      <div
                        key={col}
                        className="w-[90px] text-center text-xs font-semibold text-gray-400 dark:text-gray-600"
                      >
                        Col {col}
                      </div>
                    ))}
                  </div>

                  {/* Grid rows */}
                  {[1, 2, 3, 4, 5, 6].map((row) => (
                    <div key={row} className="flex items-center gap-1.5 mb-1.5">
                      {[1, 2, 3, 4].map((col) => {
                        const key = `${row}-${col}`;
                        const cellItems = grid[key] || [];
                        const hasItems = cellItems.length > 0;

                        return (
                          <div
                            key={key}
                            onClick={() => hasItems && handleItemClick(cellItems[0])}
                            className={`
                              w-[90px] h-[76px] rounded border flex flex-col p-1.5
                              ${hasItems
                                ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/30 cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-950/50'
                                : 'border-dashed border-gray-200 dark:border-yt-line bg-white dark:bg-yt-surface'
                              }
                            `}
                          >
                            <span className={`text-[10px] font-bold leading-none ${
                              hasItems
                                ? 'text-cyan-600 dark:text-cyan-400'
                                : 'text-gray-300 dark:text-gray-700'
                            }`}>
                              R{row}C{col}
                            </span>

                            {hasItems ? (
                              <>
                                <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 mt-1 leading-tight line-clamp-2 flex-1">
                                  {cellItems[0].name}
                                </p>
                                <span className="mt-auto self-start text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500 text-white">
                                  {cellItems.reduce((sum, i) => sum + (i.on_hand || 0), 0)}
                                </span>
                              </>
                            ) : (
                              <span className="flex-1 flex items-center justify-center text-[10px] text-gray-300 dark:text-gray-700">
                                empty
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Row label */}
                      <span className="text-xs text-gray-400 dark:text-gray-600 ml-1 w-10 shrink-0">
                        Row {row}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ItemDetailsModal opens after planogram closes */}
      {/* {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          qtyCheckedOut={0}
          onClose={() => setSelectedItem(null)}
        />
      )} */}
    </>
  );
};
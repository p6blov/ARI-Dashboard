import React from 'react';

interface LocationPickerProps {
  onLocationAdd: (cabinet: number, row: number, col: number) => void;
  existingLocations: string[];
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationAdd,
  existingLocations,
}) => {
  const [cabinet, setCabinet] = React.useState<number>(1);
  const [row, setRow] = React.useState<number>(1);
  const [col, setCol] = React.useState<number>(1);

  const handleAdd = () => {
    // Check if this location already exists
    // Locations are stored as flat array: ["cab1", "row2", "col3", "cab2", "row1", "col4"]
    // So we check every group of 3
    const locationExists = Array.from({ length: existingLocations.length / 3 }).some((_, idx) => {
      const startIdx = idx * 3;
      const existingCab = existingLocations[startIdx];
      const existingRow = existingLocations[startIdx + 1];
      const existingCol = existingLocations[startIdx + 2];
      
      return (
        existingCab === `cab${cabinet}` &&
        existingRow === `row${row}` &&
        existingCol === `col${col}`
      );
    });
    
    if (!locationExists) {
      onLocationAdd(cabinet, row, col);
    }
  };

  return (
    <div className="flex items-end space-x-2">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cabinet
        </label>
        <select
          value={cabinet}
          onChange={(e) => setCabinet(parseInt(e.target.value))}
          className="input-field text-sm"
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Row
        </label>
        <select
          value={row}
          onChange={(e) => setRow(parseInt(e.target.value))}
          className="input-field text-sm"
        >
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Column
        </label>
        <select
          value={col}
          onChange={(e) => setCol(parseInt(e.target.value))}
          className="input-field text-sm"
        >
          {[1, 2, 3, 4].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAdd}
        type="button"
        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Add
      </button>
    </div>
  );
};
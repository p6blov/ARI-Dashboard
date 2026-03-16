import React from 'react';
import { CabinetConfig } from '../services/cabinetService';

const FALLBACK_CONFIG: CabinetConfig = {
  cab1: { rows: 6, cols: 4, label: 'Cabinet 1' },
  cab2: { rows: 6, cols: 4, label: 'Cabinet 2' },
  cab3: { rows: 6, cols: 4, label: 'Cabinet 3' },
  cab4: { rows: 6, cols: 4, label: 'Cabinet 4' },
  cab5: { rows: 6, cols: 4, label: 'Cabinet 5' },
};

interface LocationPickerProps {
  onLocationAdd: (cabinetKey: string, row: number, col: number) => void;
  existingLocations: string[];
  cabinetConfig?: CabinetConfig | null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationAdd,
  existingLocations,
  cabinetConfig,
}) => {
  const config = cabinetConfig ?? FALLBACK_CONFIG;
  const cabinetKeys = Object.keys(config).sort();

  const [cabinet, setCabinet] = React.useState<string>(cabinetKeys[0] ?? 'cab1');
  const [row, setRow] = React.useState<number>(1);
  const [col, setCol] = React.useState<number>(1);

  const handleCabinetChange = (key: string) => {
    setCabinet(key);
    setRow(1);
    setCol(1);
  };

  // Keep cabinet selection valid if config changes
  React.useEffect(() => {
    if (!config[cabinet]) {
      const firstKey = Object.keys(config).sort()[0];
      if (firstKey) setCabinet(firstKey);
    }
  }, [config]);

  const currentCab = config[cabinet] ?? { rows: 6, cols: 4, label: cabinet };

  const handleAdd = () => {
    const locationExists = Array.from({ length: Math.floor(existingLocations.length / 3) }).some((_, idx) => {
      const startIdx = idx * 3;
      return (
        existingLocations[startIdx] === cabinet &&
        existingLocations[startIdx + 1] === `row${row}` &&
        existingLocations[startIdx + 2] === `col${col}`
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
          onChange={(e) => handleCabinetChange(e.target.value)}
          className="input-field text-sm"
        >
          {cabinetKeys.map((key) => (
            <option key={key} value={key}>
              {config[key].label}
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
          {Array.from({ length: currentCab.rows }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>{num}</option>
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
          {Array.from({ length: currentCab.cols }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>{num}</option>
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

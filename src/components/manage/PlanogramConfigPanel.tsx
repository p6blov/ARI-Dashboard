import React, { useState, useEffect } from 'react';
import { getCabinetConfig, updateCabinetConfig, CabinetConfig } from '../../services/cabinetService';

export const PlanogramConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<CabinetConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCabinetConfig().then(c => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, field: 'rows' | 'cols' | 'label', value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'label' ? value : Math.max(1, parseInt(value) || 1),
      },
    }));
    setSaved(false);
  };

  const handleAddCabinet = () => {
    const existing = Object.keys(config);
    const nextNum = existing.length + 1;
    const newKey = `cab${nextNum}`;
    if (config[newKey]) return;
    setConfig(prev => ({
      ...prev,
      [newKey]: { rows: 6, cols: 4, label: `Cabinet ${nextNum}` },
    }));
  };

  const handleRemoveCabinet = (key: string) => {
    if (!confirm(`Remove ${config[key]?.label || key}? Items with this cabinet location will still exist in inventory.`)) return;
    setConfig(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await updateCabinetConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-gray-400">Loading cabinet config...</p>
      </div>
    );
  }

  const cabinetKeys = Object.keys(config).sort();

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cabinet Layout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Configure the number of rows and columns for each cabinet. Changes affect the planogram display.
            </p>
          </div>
          <button
            onClick={handleAddCabinet}
            className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Cabinet</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {cabinetKeys.map(key => {
            const cab = config[key];
            return (
              <div
                key={key}
                className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">{key}</span>
                  <button
                    onClick={() => handleRemoveCabinet(key)}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Label</label>
                    <input
                      type="text"
                      value={cab.label}
                      onChange={e => handleChange(key, 'label', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rows</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={cab.rows}
                      onChange={e => handleChange(key, 'rows', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Columns</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={cab.cols}
                      onChange={e => handleChange(key, 'cols', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                  {cab.rows} rows × {cab.cols} columns = {cab.rows * cab.cols} cells
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
          )}
        </div>
      </div>
    </div>
  );
};

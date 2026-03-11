import React, { useState } from 'react';
import { ItemDraft } from '../types/item';
import { itemsRepository } from '../services/itemsRepository';
import { toStorageDateFormat } from '../utils/helpers';

interface CSVError {
  row: number;
  errors: string[];
  data: Partial<ItemDraft>;
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (imported: number) => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validRows, setValidRows] = useState<ItemDraft[]>([]);
  const [errorRows, setErrorRows] = useState<CSVError[]>([]);
  const [imported, setImported] = useState(0);

  const validateRow = (row: any, _rowIndex: number): { valid: boolean; errors: string[]; item?: ItemDraft } => {
    const errors: string[] = [];

    // Required fields
    if (!row.name || !row.name.trim()) {
      errors.push('Name is required');
    }

    // Parse location (comma-separated or array)
    let location: string[] = [];
    if (row.location) {
      if (typeof row.location === 'string') {
        location = row.location.split(',').map((l: string) => l.trim()).filter(Boolean);
      } else if (Array.isArray(row.location)) {
        location = row.location;
      }
    }

    // Build item draft
    const item: ItemDraft = {
      name: row.name?.trim() || '',
      description: row.description?.trim() || '',
      supplier: row.supplier?.trim() || '',
      location,
      count_date: row.count_date?.trim() || '',
      count_person: row.count_person?.trim() || '',
      delivery_date: row.delivery_date?.trim() || '',
      on_hand: row.on_hand ? parseInt(row.on_hand) : undefined,
      quantity: row.quantity ? parseInt(row.quantity) : undefined,
      retail_price: row.retail_price ? parseFloat(row.retail_price) : undefined,
    };

    // Validate numeric fields
    if (row.on_hand && (isNaN(item.on_hand!) || item.on_hand! < 0)) {
      errors.push('on_hand must be a positive number');
    }
    if (row.quantity && (isNaN(item.quantity!) || item.quantity! < 0)) {
      errors.push('quantity must be a positive number');
    }
    if (row.retail_price && (isNaN(item.retail_price!) || item.retail_price! < 0)) {
      errors.push('retail_price must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors,
      item: errors.length === 0 ? item : undefined,
    };
  };

  const parseCSV = (csvText: string): void => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must have headers and at least one row');
      return;
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Parse rows
    const valid: ItemDraft[] = [];
    const errors: CSVError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const validation = validateRow(row, i + 1);

      if (validation.valid && validation.item) {
        valid.push(validation.item);
      } else {
        errors.push({
          row: i + 1,
          errors: validation.errors,
          data: row,
        });
      }
    }

    setValidRows(valid);
    setErrorRows(errors);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsing(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
        setParsing(false);
      };
      reader.readAsText(selectedFile);
    }
  };

  const importRows = async (rows: ItemDraft[]) => {
    setImporting(true);
    let count = 0;

    for (const row of rows) {
      try {
        // Convert dates to storage format
        const itemToCreate = {
          ...row,
          count_date: toStorageDateFormat(row.count_date),
          delivery_date: toStorageDateFormat(row.delivery_date),
        };

        await itemsRepository.createItem(itemToCreate);
        count++;
        setImported(count);
      } catch (err) {
        console.error('Failed to import row:', err);
      }
    }

    setImporting(false);
    onComplete(count);
    handleClose();
  };

  const handleImportValid = () => {
    importRows(validRows);
  };

  const handleImportAll = () => {
    // Create items from error rows with defaults
    const allRows = [
      ...validRows,
      ...errorRows.map(err => ({
        name: err.data.name || 'Untitled Item',
        description: err.data.description || '',
        supplier: err.data.supplier || '',
        location: err.data.location || [],
        count_date: err.data.count_date || '',
        count_person: err.data.count_person || '',
        delivery_date: err.data.delivery_date || '',
        on_hand: err.data.on_hand,
        quantity: err.data.quantity,
        retail_price: err.data.retail_price,
      } as ItemDraft)),
    ];
    importRows(allRows);
  };

  const handleClose = () => {
    setFile(null);
    setValidRows([]);
    setErrorRows([]);
    setImported(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Items from CSV</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={importing}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* File Upload */}
          {!file && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                    Upload a CSV file
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="mt-1 text-xs text-gray-500">CSV with headers: name, description, supplier, location, etc.</p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">CSV Format Requirements:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>name</strong> - Required, item name</li>
                  <li>• <strong>description</strong> - Item description</li>
                  <li>• <strong>supplier</strong> - Supplier name</li>
                  <li>• <strong>location</strong> - Comma-separated locations</li>
                  <li>• <strong>on_hand</strong> - Current stock (number)</li>
                  <li>• <strong>quantity</strong> - Total quantity (number)</li>
                  <li>• <strong>retail_price</strong> - Price (number)</li>
                  <li>• <strong>count_date</strong> - Last count date (YYYY-MM-DD)</li>
                  <li>• <strong>count_person</strong> - Person who counted</li>
                  <li>• <strong>delivery_date</strong> - Expected delivery (YYYY-MM-DD)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Parsing */}
          {parsing && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Parsing CSV...</p>
            </div>
          )}

          {/* Results */}
          {file && !parsing && (
            <div className="space-y-6">
              {/* Valid Rows */}
              {validRows.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    ✓ Valid Rows ({validRows.length})
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {validRows.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="text-sm text-green-800 py-1">
                        • {item.name} - {item.supplier || 'No supplier'}
                      </div>
                    ))}
                    {validRows.length > 5 && (
                      <p className="text-sm text-green-700 mt-2">
                        ... and {validRows.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Rows */}
              {errorRows.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    ✗ Errors ({errorRows.length})
                  </h3>
                  <div className="bg-red-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                    {errorRows.map((err, idx) => (
                      <div key={idx} className="border-b border-red-200 pb-2 last:border-0">
                        <div className="text-sm font-medium text-red-900">
                          Row {err.row}: {err.data.name || 'Unnamed'}
                        </div>
                        <ul className="text-xs text-red-700 ml-4 mt-1">
                          {err.errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Progress */}
              {importing && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Importing...</span>
                    <span className="text-sm text-blue-700">{imported} imported</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(imported / (validRows.length + errorRows.length)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {file && !parsing && !importing && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              {errorRows.length > 0 && (
                <button
                  onClick={handleImportAll}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  Import All ({validRows.length + errorRows.length} items)
                </button>
              )}
              {validRows.length > 0 && (
                <button
                  onClick={handleImportValid}
                  className="btn-primary"
                >
                  Import Valid Only ({validRows.length} items)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

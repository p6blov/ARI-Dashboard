import React, { useState } from 'react';
import { ItemDraft } from '../types/item';
import { itemsRepository } from '../services/itemsRepository';
import { toStorageDateFormat } from '../utils/helpers';

interface CSVError {
  row: number;
  errors: string[];
  data: any;
}

interface ParsedRow {
  draft: ItemDraft;
  locationArr: string[][]; // array of ["cabN","rowN","colN"] entries
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
  const [validRows, setValidRows] = useState<ParsedRow[]>([]);
  const [errorRows, setErrorRows] = useState<CSVError[]>([]);
  const [imported, setImported] = useState(0);
  const [totalToImport, setTotalToImport] = useState(0);

  /**
   * Parse a location string from CSV into a 3-element array.
   * Accepts: "cab1-row2-col3", "cab1,row2,col3", or plain numbers "1,2,3"
   * Returns ["cab1","row2","col3"] or null if unparseable.
   */
  const parseLocationFromCSV = (locStr: string): string[] | null => {
    // cab1-row2-col3 or cab1,row2,col3
    const dashMatch = locStr.match(/cab(\d+)[-,]row(\d+)[-,]col(\d+)/i);
    if (dashMatch) return [`cab${dashMatch[1]}`, `row${dashMatch[2]}`, `col${dashMatch[3]}`];

    // Three comma-separated numbers: 1,2,3
    const numsMatch = locStr.trim().match(/^(\d+)[,\s]+(\d+)[,\s]+(\d+)$/);
    if (numsMatch) return [`cab${numsMatch[1]}`, `row${numsMatch[2]}`, `col${numsMatch[3]}`];

    return null;
  };

  const validateRow = (row: any, rowIndex: number): { valid: boolean; errors: string[]; parsed?: ParsedRow } => {
    const errors: string[] = [];

    if (!row.name || !row.name.trim()) {
      errors.push('Name is required');
    }

    // Parse locations — CSV column "location" can be one location string, or semicolon-separated
    const locationArrays: string[][] = [];
    if (row.location) {
      const parts = String(row.location).split(';').map((s: string) => s.trim()).filter(Boolean);
      for (const part of parts) {
        const parsed = parseLocationFromCSV(part);
        if (parsed) {
          locationArrays.push(parsed);
        } else if (part) {
          // Treat as unknown, skip silently but store as a note
          console.warn(`Row ${rowIndex}: could not parse location "${part}"`);
        }
      }
    }

    const parseNumber = (value: any): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = parseFloat(String(value).trim());
      return isNaN(num) ? undefined : num;
    };

    const on_hand = parseNumber(row.on_hand);
    const quantity = parseNumber(row.quantity);
    const retail_price = parseNumber(row.retail_price);

    const draft: ItemDraft = {
      name: row.name?.trim() || '',
      description: row.description?.trim() || '',
      supplier: row.supplier?.trim() || '',
      location: locationArrays as any,
      count_date: row.count_date?.trim() || '',
      count_person: row.count_person?.trim() || '',
      delivery_date: row.delivery_date?.trim() || '',
      on_hand,
      quantity,
      retail_price,
    };

    if (row.on_hand && row.on_hand.toString().trim() !== '' && (on_hand === undefined || on_hand < 0)) {
      errors.push('on_hand must be a positive number');
    }
    if (row.quantity && row.quantity.toString().trim() !== '' && (quantity === undefined || quantity < 0)) {
      errors.push('quantity must be a positive number');
    }
    if (row.retail_price && row.retail_price.toString().trim() !== '' && (retail_price === undefined || retail_price < 0)) {
      errors.push('retail_price must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors,
      parsed: errors.length === 0 ? { draft, locationArr: locationArrays } : undefined,
    };
  };

  const parseCSV = (csvText: string): void => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must have headers and at least one row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const valid: ParsedRow[] = [];
    const errors: CSVError[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle quoted values with commas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const ch of lines[i]) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      values.push(current.trim());

      const row: any = {};
      headers.forEach((header, index) => { row[header] = values[index] || ''; });

      const validation = validateRow(row, i + 1);
      if (validation.valid && validation.parsed) {
        valid.push(validation.parsed);
      } else {
        errors.push({ row: i + 1, errors: validation.errors, data: row });
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

  const importRows = async (rows: ParsedRow[]) => {
    setImporting(true);
    setTotalToImport(rows.length);
    setImported(0);
    let count = 0;

    for (const row of rows) {
      try {
        const itemToCreate: ItemDraft = {
          ...row.draft,
          count_date: toStorageDateFormat(row.draft.count_date),
          delivery_date: toStorageDateFormat(row.draft.delivery_date),
          // location is already the 3-element array structure
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

  const handleImportValid = () => importRows(validRows);

  const handleImportAll = () => {
    const errorAsParsed: ParsedRow[] = errorRows.map(err => ({
      draft: {
        name: err.data.name || 'Untitled Item',
        description: err.data.description || '',
        supplier: err.data.supplier || '',
        location: [] as any,
        count_date: err.data.count_date || '',
        count_person: err.data.count_person || '',
        delivery_date: err.data.delivery_date || '',
        on_hand: err.data.on_hand,
        quantity: err.data.quantity,
        retail_price: err.data.retail_price,
      },
      locationArr: [],
    }));
    importRows([...validRows, ...errorAsParsed]);
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
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Items from CSV</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={importing}
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950">
          {!file && (
            <div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <label className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                    Upload a CSV file
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  </label>
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">CSV with headers: name, description, supplier, location, etc.</p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">CSV Format Requirements:</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• <strong>name</strong> — Required</li>
                  <li>• <strong>description</strong> — Item description</li>
                  <li>• <strong>supplier</strong> — Supplier name</li>
                  <li>• <strong>location</strong> — Format: <code>cab1-row2-col3</code> or <code>1,2,3</code> (semicolon-separate multiple locations)</li>
                  <li>• <strong>on_hand</strong> — Current stock (number)</li>
                  <li>• <strong>quantity</strong> — Total quantity (number)</li>
                  <li>• <strong>retail_price</strong> — Price (number)</li>
                  <li>• <strong>count_date</strong> — Last count date (YYYY-MM-DD)</li>
                  <li>• <strong>count_person</strong> — Person who counted</li>
                  <li>• <strong>delivery_date</strong> — Expected delivery (YYYY-MM-DD)</li>
                </ul>
                <p className="text-xs text-blue-700 dark:text-blue-500 mt-2">
                  Items are automatically assigned sequential IDs based on the database count.
                </p>
              </div>
            </div>
          )}

          {parsing && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Parsing CSV...</p>
            </div>
          )}

          {file && !parsing && (
            <div className="space-y-6">
              {validRows.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                    ✓ Valid Rows ({validRows.length})
                  </h3>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {validRows.slice(0, 5).map((row, idx) => (
                      <div key={idx} className="text-sm text-green-800 dark:text-green-400 py-1">
                        • {row.draft.name} - {row.draft.supplier || 'No supplier'}
                      </div>
                    ))}
                    {validRows.length > 5 && (
                      <p className="text-sm text-green-700 dark:text-green-500 mt-2">
                        ... and {validRows.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {errorRows.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
                    ✗ Errors ({errorRows.length})
                  </h3>
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                    {errorRows.map((err, idx) => (
                      <div key={idx} className="border-b border-red-200 dark:border-red-800 pb-2 last:border-0">
                        <div className="text-sm font-medium text-red-900 dark:text-red-400">
                          Row {err.row}: {err.data.name || 'Unnamed'}
                        </div>
                        <ul className="text-xs text-red-700 dark:text-red-500 ml-4 mt-1">
                          {err.errors.map((error, i) => <li key={i}>• {error}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importing && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Importing items...</span>
                    <span className="text-sm text-blue-700 dark:text-blue-400">
                      {imported} / {totalToImport} ({Math.round((imported / totalToImport) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(imported / totalToImport) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {file && !parsing && !importing && (
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-black flex items-center justify-between">
            <button onClick={handleClose} className="btn-secondary">Cancel</button>
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
                <button onClick={handleImportValid} className="btn-primary">
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

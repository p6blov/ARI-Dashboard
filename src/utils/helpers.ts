/**
 * Debounce function to limit how often a function is called
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  
  try {
    const mmddyyyyRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateStr.match(mmddyyyyRegex);
    
    if (match) {
      const [, month, day, year] = match;
      const isoDate = `${year}-${month}-${day}`;
      const date = new Date(isoDate);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
      }
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Convert date string to YYYY-MM-DD format for input fields
 */
export function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return '';
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  const mmddyyyyRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.match(mmddyyyyRegex);
  
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Return original if can't parse
  }
  
  return '';
}

/**
 * Convert YYYY-MM-DD to MM-DD-YYYY for consistency with iOS app
 */
export function toStorageDateFormat(dateStr: string): string {
  if (!dateStr) return '';
  
  const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(yyyymmddRegex);
  
  if (match) {
    const [, year, month, day] = match;
    return `${month}-${day}-${year}`;
  }
  
  return dateStr;
}

/**
 * Format a price for display
 */
export function formatPrice(price?: number): string {
  if (price === undefined || price === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Get unique values from an array
 */
export function getUniqueValues<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Flatten array of arrays
 */
export function flattenArray<T>(arr: T[][]): T[] {
  return arr.reduce((acc, val) => acc.concat(val), []);
}

/**
 * Extract company name from supplier URL
 */
export function getSupplierNameFromUrl(url: string): string {
  if (!url) return 'Unknown Supplier';

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const cleanHostname = hostname.replace(/^www\./, '');

    const supplierMappings: { [key: string]: string } = {
      'amazon.com': 'Amazon',
      'a.co': 'Amazon',
      'amzn.to': 'Amazon',
      'ebay.com': 'eBay',
      'walmart.com': 'Walmart',
      'target.com': 'Target',
      'homedepot.com': 'Home Depot',
      'lowes.com': "Lowe's",
      'grainger.com': 'Grainger',
      'mcmaster.com': 'McMaster-Carr',
      'uline.com': 'Uline',
      'alibaba.com': 'Alibaba',
      'aliexpress.com': 'AliExpress',
      'newegg.com': 'Newegg',
      'bestbuy.com': 'Best Buy',
    };

    for (const [domain, name] of Object.entries(supplierMappings)) {
      if (cleanHostname === domain || cleanHostname.endsWith('.' + domain)) {
        return name;
      }
    }

    const parts = cleanHostname.split('.');
    if (parts.length >= 2) {
      const mainName = parts[parts.length - 2];
      return mainName.charAt(0).toUpperCase() + mainName.slice(1);
    }

    return cleanHostname;
  } catch {
    return url;
  }
}

/**
 * Check if two supplier URLs belong to the same company
 */
export function isSameSupplier(url1: string, url2: string): boolean {
  if (!url1 || !url2) return false;
  
  const name1 = getSupplierNameFromUrl(url1);
  const name2 = getSupplierNameFromUrl(url2);
  
  return name1.toLowerCase() === name2.toLowerCase();
}

/**
 * Extract trailing number from a location string like "cab1", "row2", "col3"
 */
export function extractLocationNumber(str: string): string {
  const match = str.match(/(\d+)$/);
  return match ? match[1] : str;
}

/**
 * Parse location array (new format: ["cab1", "row2", "col3"])
 * Also supports legacy single-string format: "cab1-row2-col3"
 * Returns { cabinet, row, col } as strings, or null if unparseable
 */
export function parseLocation(locationData: string | string[]): { cabinet: string; row: string; col: string } | null {
  // New format: array of 3 strings
  if (Array.isArray(locationData) && locationData.length === 3) {
    return {
      cabinet: extractLocationNumber(locationData[0]),
      row: extractLocationNumber(locationData[1]),
      col: extractLocationNumber(locationData[2]),
    };
  }

  // Legacy single-string format: "cab1-row2-col3"
  const str = Array.isArray(locationData) ? locationData[0] : locationData;
  if (!str) return null;

  const match = str.match(/cab(\d+)-row(\d+)-col(\d+)/i);
  if (match) {
    return {
      cabinet: match[1],
      row: match[2],
      col: match[3],
    };
  }

  // Try parsing individual segment like "cab1"
  const cabMatch = str.match(/cab(\d+)/i);
  const rowMatch = str.match(/row(\d+)/i);
  const colMatch = str.match(/col(\d+)/i);
  if (cabMatch || rowMatch || colMatch) {
    return {
      cabinet: cabMatch ? cabMatch[1] : '-',
      row: rowMatch ? rowMatch[1] : '-',
      col: colMatch ? colMatch[1] : '-',
    };
  }

  return null;
}

/**
 * Build the 3-element location array from cabinet/row/col numbers
 * Returns ["cab1", "row2", "col3"]
 */
export function buildLocationArray(cabinet: number, row: number, col: number): string[] {
  return [`cab${cabinet}`, `row${row}`, `col${col}`];
}

/**
 * Get display values for a location array (new format)
 * Returns { cabinet, row, col } as display strings
 */
export function getLocationDisplay(locationData: string | string[]): { cabinet: string; row: string; col: string } | null {
  return parseLocation(locationData);
}

/**
 * Format location array for display as a human-readable string
 */
export function formatLocationLabel(location: string[]): string {
  if (!location || location.length === 0) return '';
  const parsed = parseLocation(location);
  if (!parsed) return location.join(', ');
  return `Cab ${parsed.cabinet} · Row ${parsed.row} · Col ${parsed.col}`;
}

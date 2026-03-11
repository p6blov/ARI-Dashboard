/**
 * Debounce function to limit how often a function is called
 */
export function debounce<T extends (...args: any[]) => void>(
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
    // Handle MM-DD-YYYY format from iOS app
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
    
    // Try standard date parsing
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
 * Handles both ISO format and MM-DD-YYYY format from iOS
 */
export function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return '';
  
  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Handle MM-DD-YYYY format from iOS app
  const mmddyyyyRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.match(mmddyyyyRegex);
  
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse as standard date
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
    // Parse URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Remove www. prefix
    const cleanHostname = hostname.replace(/^www\./, '');

    // Known supplier mappings
    const supplierMappings: { [key: string]: string } = {
      // Amazon variants
      'amazon.com': 'Amazon',
      'amazon.ca': 'Amazon',
      'amazon.co.uk': 'Amazon',
      'amazon.de': 'Amazon',
      'amazon.fr': 'Amazon',
      'amazon.co.jp': 'Amazon',
      'a.co': 'Amazon',
      'amzn.to': 'Amazon',
      'amzn.com': 'Amazon',
      
      // Major retailers
      'ebay.com': 'eBay',
      'ebay.co.uk': 'eBay',
      'walmart.com': 'Walmart',
      'target.com': 'Target',
      'costco.com': 'Costco',
      'homedepot.com': 'Home Depot',
      'lowes.com': "Lowe's",
      'bestbuy.com': 'Best Buy',
      
      // Industrial suppliers
      'grainger.com': 'Grainger',
      'mcmaster.com': 'McMaster-Carr',
      'uline.com': 'Uline',
      'fastenal.com': 'Fastenal',
      'mscdirect.com': 'MSC Industrial',
      
      // International
      'alibaba.com': 'Alibaba',
      'aliexpress.com': 'AliExpress',
      'banggood.com': 'Banggood',
      
      // Electronics
      'newegg.com': 'Newegg',
      'microcenter.com': 'Micro Center',
      'mouser.com': 'Mouser',
      'digikey.com': 'Digi-Key',
      'sparkfun.com': 'SparkFun',
      'adafruit.com': 'Adafruit',
      'pololu.com': 'Pololu',
      'robotshop.com': 'RobotShop',
      'servocity.com': 'ServoCity',
      
      // Specialty
      'rcdrone.top': 'RC Drone',
      'hobbyking.com': 'HobbyKing',
      'getfpv.com': 'GetFPV',
      'racedayquads.com': 'RaceDayQuads',
    };

    // Check known suppliers
    for (const [domain, name] of Object.entries(supplierMappings)) {
      if (cleanHostname === domain || cleanHostname.endsWith('.' + domain)) {
        return name;
      }
    }

    // Extract main domain name (remove TLD)
    const parts = cleanHostname.split('.');
    if (parts.length >= 2) {
      const mainName = parts[parts.length - 2];
      // Capitalize first letter
      return mainName.charAt(0).toUpperCase() + mainName.slice(1);
    }

    return cleanHostname;
  } catch {
    // If URL parsing fails, return the original string
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
 * Format a location array ["cab1", "row2", "col3"] into "Cab 1 · Row 2 · Col 3"
 */
export function formatLocationLabel(location: string[]): string {
  if (!location || location.length !== 3) return location?.join(' ') ?? '';

  const cab = location[0].replace(/\D/g, '');
  const row = location[1].replace(/\D/g, '');
  const col = location[2].replace(/\D/g, '');

  return `Cab ${cab} · Row ${row} · Col ${col}`;
}

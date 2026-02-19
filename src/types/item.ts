/**
 * Location structure for physical storage
 */
export interface ItemLocation {
  cabinet: number;  // 1-5
  row: number;      // 1-6
  col: number;      // 1-4
}

/**
 * Core Item type representing an inventory item in Firestore
 */
export interface Item {
  id: string;              // Firestore document id
  name: string;
  quantity?: number;       // optional
  on_hand?: number;        // optional
  count_date: string;      // can be empty string
  count_person: string;    // can be empty string
  delivery_date: string;   // can be empty string
  location: string[];      // array of formatted location strings ["cab1-row1-col1"]
  locations?: ItemLocation[]; // structured location data (optional for backwards compatibility)
  supplier: string;
  supplier_url?: string;   // optional supplier URL
  retail_price?: number;   // optional
  description: string;
}

/**
 * Type for creating a new item (without id)
 */
export type ItemDraft = Omit<Item, 'id'>;

/**
 * Type for partial updates to an item
 */
export type ItemPatch = Partial<Omit<Item, 'id'>>;

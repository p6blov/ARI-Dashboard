import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import { Item } from '../types/item';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: number;
  team: string;
}

export interface CheckedOutItem {
  itemId: string;
  itemRef?: DocumentReference;
  qty: number;
  updatedAt: any; // Timestamp
}

export interface CheckedOutItemWithDetails extends CheckedOutItem {
  item: Item | null;
}

/**
 * Fetch user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      uid,
      name: data.name || 'Unknown',
      email: data.email || '',
      role: data.role || 0,
      team: data.team || '',
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
}

/**
 * Fetch checked out items for a user
 */
export async function getCheckedOutItems(uid: string): Promise<CheckedOutItem[]> {
  try {
    const checkedOutRef = collection(db, 'users', uid, 'checkedOutItems');
    const q = query(checkedOutRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      itemId: doc.id,
      ...doc.data(),
    } as CheckedOutItem));
  } catch (error) {
    console.error('Error fetching checked out items:', error);
    throw new Error('Failed to fetch checked out items');
  }
}

/**
 * Fetch item details by ID
 */
export async function getItemDetails(itemId: string): Promise<Item | null> {
  try {
    const itemDoc = await getDoc(doc(db, 'items', itemId));
    
    if (!itemDoc.exists()) {
      return null;
    }

    return {
      id: itemDoc.id,
      ...itemDoc.data(),
    } as Item;
  } catch (error) {
    console.error('Error fetching item details:', error);
    return null;
  }
}

/**
 * Fetch multiple items with concurrency limit
 * @param itemIds Array of item IDs to fetch
 * @param concurrencyLimit Maximum number of concurrent requests (default: 5)
 */
export async function getItemsBatch(
  itemIds: string[],
  concurrencyLimit: number = 5
): Promise<Map<string, Item | null>> {
  const results = new Map<string, Item | null>();
  
  // Process in batches
  for (let i = 0; i < itemIds.length; i += concurrencyLimit) {
    const batch = itemIds.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(id => getItemDetails(id));
    const batchResults = await Promise.all(batchPromises);
    
    batch.forEach((id, index) => {
      results.set(id, batchResults[index]);
    });
  }
  
  return results;
}

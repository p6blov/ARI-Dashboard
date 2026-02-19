import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Item, ItemDraft, ItemPatch } from '../types/item';

const ITEMS_COLLECTION = 'items';
const METADATA_COLLECTION = 'metadata';
const COUNT_DOC = 'count';

/**
 * Get the next item count from metadata and increment it atomically.
 * Returns the new count (used as the item suffix).
 */
async function getNextItemCount(): Promise<number> {
  const countRef = doc(db, METADATA_COLLECTION, COUNT_DOC);
  
  return runTransaction(db, async (transaction) => {
    const countSnap = await transaction.get(countRef);
    const current: number = countSnap.exists() ? (countSnap.data().count ?? 0) : 0;
    const next = current + 1;
    transaction.set(countRef, { count: next }, { merge: true });
    return next;
  });
}

/**
 * Build a document ID from an item name + count.
 * e.g. "Red Valve" + 42 => "redvalve42"
 */
function buildItemDocId(name: string, count: number): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '') + count;
}

export class FirestoreItemsRepository {
  subscribeToItems(callback: (items: Item[]) => void): Unsubscribe {
    const itemsQuery = query(collection(db, ITEMS_COLLECTION));

    return onSnapshot(
      itemsQuery,
      (snapshot) => {
        const items: Item[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Item));
        callback(items);
      },
      (error) => {
        console.error('Error subscribing to items:', error);
        throw new Error('Failed to subscribe to items: ' + error.message);
      }
    );
  }

  async getAllItems(): Promise<Item[]> {
    try {
      const snapshot = await getDocs(collection(db, ITEMS_COLLECTION));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Item));
    } catch (error) {
      console.error('Error fetching items:', error);
      throw new Error('Failed to fetch items');
    }
  }

  async getItem(id: string): Promise<Item | null> {
    try {
      const docRef = doc(db, ITEMS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Item;
    } catch (error) {
      console.error('Error fetching item:', error);
      throw new Error('Failed to fetch item');
    }
  }

  /**
   * Create a new item using sequential ID from metadata/count.
   * Document ID format: <cleanedname><count+1>  e.g. "redvalve42"
   */
  async createItem(itemDraft: ItemDraft): Promise<Item> {
    try {
      if (!itemDraft.name?.trim()) {
        throw new Error('Item name is required');
      }

      const validatedDraft = {
        ...itemDraft,
        name: itemDraft.name.trim(),
        on_hand: itemDraft.on_hand !== undefined ? Math.max(0, itemDraft.on_hand) : undefined,
        quantity: itemDraft.quantity !== undefined ? Math.max(0, itemDraft.quantity) : undefined,
        retail_price: itemDraft.retail_price !== undefined ? Math.max(0, itemDraft.retail_price) : undefined,
        location: Array.isArray(itemDraft.location) ? itemDraft.location : [],
        count_date: itemDraft.count_date || '',
        count_person: itemDraft.count_person || '',
        delivery_date: itemDraft.delivery_date || '',
        supplier: itemDraft.supplier || '',
        description: itemDraft.description || '',
      };

      const nextCount = await getNextItemCount();
      const docId = buildItemDocId(validatedDraft.name, nextCount);
      const docRef = doc(db, ITEMS_COLLECTION, docId);
      await setDoc(docRef, validatedDraft);

      return {
        id: docId,
        ...validatedDraft,
      } as Item;
    } catch (error) {
      console.error('Error creating item:', error);
      throw new Error('Failed to create item: ' + (error as Error).message);
    }
  }

  async updateItem(id: string, patch: ItemPatch): Promise<void> {
    try {
      if (patch.name !== undefined && !patch.name.trim()) {
        throw new Error('Item name cannot be empty');
      }

      const validatedPatch: Partial<Item> = { ...patch };

      if (patch.on_hand !== undefined) {
        validatedPatch.on_hand = Math.max(0, patch.on_hand);
      }
      if (patch.quantity !== undefined) {
        validatedPatch.quantity = Math.max(0, patch.quantity);
      }
      if (patch.retail_price !== undefined) {
        validatedPatch.retail_price = Math.max(0, patch.retail_price);
      }

      const docRef = doc(db, ITEMS_COLLECTION, id);
      await updateDoc(docRef, validatedPatch);
    } catch (error) {
      console.error('Error updating item:', error);
      throw new Error('Failed to update item: ' + (error as Error).message);
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const docRef = doc(db, ITEMS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw new Error('Failed to delete item');
    }
  }
}

export const itemsRepository = new FirestoreItemsRepository();

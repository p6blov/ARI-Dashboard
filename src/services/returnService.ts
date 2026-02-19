import {
  doc,
  runTransaction,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Return a checked-out item
 * Uses Firestore transaction to ensure consistency
 * 
 * @param uid User ID
 * @param itemId Item document ID
 * @param qty Quantity to return
 */
export async function returnItem(
  uid: string,
  itemId: string,
  qty: number
): Promise<void> {
  if (qty <= 0) {
    throw new Error('Return quantity must be greater than 0');
  }

  try {
    await runTransaction(db, async (transaction) => {
      // References
      const itemRef = doc(db, 'items', itemId);
      const checkedOutRef = doc(db, 'users', uid, 'checkedOutItems', itemId);

      // Read checked out record
      const checkedOutDoc = await transaction.get(checkedOutRef);
      
      if (!checkedOutDoc.exists()) {
        throw new Error('No checked-out record found for this item');
      }

      const checkedOutData = checkedOutDoc.data();
      const currentQty = checkedOutData.qty || 0;

      if (qty > currentQty) {
        throw new Error(`Cannot return ${qty} items. Only ${currentQty} checked out.`);
      }

      // Update or delete checked out record
      if (qty === currentQty) {
        // Returning all items - delete the record
        transaction.delete(checkedOutRef);
      } else {
        // Partial return - decrement quantity
        transaction.update(checkedOutRef, {
          qty: increment(-qty),
          updatedAt: new Date(),
        });
      }

      // Update item inventory - increment on_hand
      transaction.update(itemRef, {
        on_hand: increment(qty),
      });
    });
  } catch (error) {
    console.error('Error returning item:', error);
    throw error;
  }
}

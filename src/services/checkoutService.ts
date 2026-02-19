import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Check out an item for a user
 * Uses Firestore transaction to ensure consistency between inventory and user checkout
 * 
 * @param uid User ID
 * @param itemId Item document ID
 * @param qty Quantity to check out
 */
export async function checkoutItem(
  uid: string,
  itemId: string,
  qty: number
): Promise<void> {
  if (qty <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  try {
    await runTransaction(db, async (transaction) => {
      // References
      const itemRef = doc(db, 'items', itemId);
      const checkedOutRef = doc(db, 'users', uid, 'checkedOutItems', itemId);

      // Read item to check availability
      const itemDoc = await transaction.get(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error('Item not found');
      }

      const itemData = itemDoc.data();
      const currentOnHand = itemData.on_hand ?? 0;

      // Check if enough quantity available
      if (currentOnHand < qty) {
        throw new Error(`Only ${currentOnHand} available in stock`);
      }

      // Read existing checkout record
      const checkedOutDoc = await transaction.get(checkedOutRef);

      if (checkedOutDoc.exists()) {
        // Document exists - increment quantity
        transaction.update(checkedOutRef, {
          qty: increment(qty),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Document doesn't exist - create new
        transaction.set(checkedOutRef, {
          itemId: itemId,
          qty: qty,
          updatedAt: serverTimestamp(),
        });
      }

      // Update item inventory - decrement on_hand
      transaction.update(itemRef, {
        on_hand: increment(-qty),
      });
    });
  } catch (error) {
    console.error('Error checking out item:', error);
    throw error;
  }
}

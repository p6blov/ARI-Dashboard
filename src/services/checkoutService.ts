import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  addDoc,
  collection,
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
      const itemRef = doc(db, 'items', itemId);
      const checkedOutRef = doc(db, 'users', uid, 'checkedOutItems', itemId);

      const itemDoc = await transaction.get(itemRef);

      if (!itemDoc.exists()) {
        throw new Error('Item not found');
      }

      const itemData = itemDoc.data();
      const currentOnHand = itemData.on_hand ?? 0;

      if (currentOnHand < qty) {
        throw new Error(`Only ${currentOnHand} available in stock`);
      }

      const checkedOutDoc = await transaction.get(checkedOutRef);

      if (checkedOutDoc.exists()) {
        transaction.update(checkedOutRef, {
          qty: increment(qty),
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.set(checkedOutRef, {
          itemId: itemId,
          qty: qty,
          updatedAt: serverTimestamp(),
        });
      }

      transaction.update(itemRef, {
        on_hand: increment(-qty),
      });
    });

    // Write audit log after successful transaction
    await addDoc(collection(db, 'checkoutLogs'), {
      userId: uid,
      itemId,
      action: 'checkout',
      qty,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error checking out item:', error);
    throw error;
  }
}

import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  addDoc,
  collection,
  Timestamp,
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

  let durationMs: number | undefined;

  try {
    await runTransaction(db, async (transaction) => {
      const itemRef = doc(db, 'items', itemId);
      const checkedOutRef = doc(db, 'users', uid, 'checkedOutItems', itemId);

      const checkedOutDoc = await transaction.get(checkedOutRef);

      if (!checkedOutDoc.exists()) {
        throw new Error('No checked-out record found for this item');
      }

      const checkedOutData = checkedOutDoc.data();
      const currentQty = checkedOutData.qty || 0;

      if (qty > currentQty) {
        throw new Error(`Cannot return ${qty} items. Only ${currentQty} checked out.`);
      }

      // Calculate duration from when the item was last updated (checked out)
      const updatedAt = checkedOutData.updatedAt as Timestamp | null;
      if (updatedAt && typeof updatedAt.toMillis === 'function') {
        durationMs = Date.now() - updatedAt.toMillis();
      }

      if (qty === currentQty) {
        transaction.delete(checkedOutRef);
      } else {
        transaction.update(checkedOutRef, {
          qty: increment(-qty),
          updatedAt: new Date(),
        });
      }

      transaction.update(itemRef, {
        on_hand: increment(qty),
      });
    });

    // Write audit log after successful transaction
    await addDoc(collection(db, 'checkoutLogs'), {
      userId: uid,
      itemId,
      action: 'return',
      qty,
      timestamp: serverTimestamp(),
      ...(durationMs !== undefined && { durationMs }),
    });
  } catch (error) {
    console.error('Error returning item:', error);
    throw error;
  }
}

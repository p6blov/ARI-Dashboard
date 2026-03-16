import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

export interface CheckoutLog {
  id: string;
  userId: string;
  itemId: string;
  action: 'checkout' | 'return';
  qty: number;
  timestamp: Timestamp;
  durationMs?: number;
}

export interface LogFilters {
  userId?: string;
  action?: 'checkout' | 'return';
  startDate?: Date;
  endDate?: Date;
}

export async function getCheckoutLogs(filters: LogFilters = {}): Promise<CheckoutLog[]> {
  const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')];

  if (filters.userId) {
    constraints.push(where('userId', '==', filters.userId));
  }
  if (filters.action) {
    constraints.push(where('action', '==', filters.action));
  }
  if (filters.startDate) {
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
  }
  if (filters.endDate) {
    constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
  }

  const q = query(collection(db, 'checkoutLogs'), ...constraints);
  const snap = await getDocs(q);

  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CheckoutLog));
}

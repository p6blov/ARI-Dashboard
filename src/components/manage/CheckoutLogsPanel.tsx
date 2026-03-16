import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getCheckoutLogs, CheckoutLog } from '../../services/logsService';
import { UserProfile } from '../../services/profileService';
import { getItemDetails } from '../../services/profileService';
import { Item } from '../../types/item';

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function formatTimestamp(ts: any): string {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString();
}

export const CheckoutLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<CheckoutLog[]>([]);
  const [users, setUsers] = useState<Map<string, UserProfile>>(new Map());
  const [items, setItems] = useState<Map<string, Item | null>>(new Map());
  const [loading, setLoading] = useState(true);

  const [filterUserId, setFilterUserId] = useState('');
  const [filterAction, setFilterAction] = useState<'checkout' | 'return' | ''>('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const loadUsers = useCallback(async () => {
    const snap = await getDocs(collection(db, 'users'));
    const map = new Map<string, UserProfile>();
    snap.docs.forEach(d => map.set(d.id, { uid: d.id, ...d.data() } as UserProfile));
    setUsers(map);
    return map;
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCheckoutLogs({
        userId: filterUserId || undefined,
        action: filterAction || undefined,
        startDate: filterStart ? new Date(filterStart) : undefined,
        endDate: filterEnd ? new Date(filterEnd + 'T23:59:59') : undefined,
      });
      setLogs(result);

      // Resolve item names we haven't loaded yet
      const unknownItemIds = [...new Set(result.map(l => l.itemId))].filter(id => !items.has(id));
      const resolved = await Promise.all(unknownItemIds.map(id => getItemDetails(id)));
      setItems(prev => {
        const next = new Map(prev);
        unknownItemIds.forEach((id, i) => next.set(id, resolved[i]));
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [filterUserId, filterAction, filterStart, filterEnd, items]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadLogs();
  }, [filterUserId, filterAction, filterStart, filterEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  const userOptions = [...users.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-200 dark:border-yt-line bg-white dark:bg-yt-surface">
        <select
          value={filterUserId}
          onChange={e => setFilterUserId(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-yt-line rounded bg-white dark:bg-yt-elevated text-gray-900 dark:text-white"
        >
          <option value="">All users</option>
          {userOptions.map(u => (
            <option key={u.uid} value={u.uid}>{u.name}</option>
          ))}
        </select>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value as any)}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-yt-line rounded bg-white dark:bg-yt-elevated text-gray-900 dark:text-white"
        >
          <option value="">All actions</option>
          <option value="checkout">Checkouts</option>
          <option value="return">Returns</option>
        </select>

        <input
          type="date"
          value={filterStart}
          onChange={e => setFilterStart(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-yt-line rounded bg-white dark:bg-yt-elevated text-gray-900 dark:text-white"
          placeholder="From date"
        />
        <input
          type="date"
          value={filterEnd}
          onChange={e => setFilterEnd(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-yt-line rounded bg-white dark:bg-yt-elevated text-gray-900 dark:text-white"
          placeholder="To date"
        />

        <span className="text-xs text-gray-400 dark:text-gray-600">{logs.length} records</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400">No logs found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-yt-surface border-b border-gray-200 dark:border-yt-line">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const user = users.get(log.userId);
                const item = items.get(log.itemId);
                return (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-yt-line hover:bg-gray-50 dark:hover:bg-yt-hover">
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {user?.name ?? <span className="text-xs text-gray-400 font-mono">{log.userId.slice(0, 8)}…</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {item?.name ?? <span className="text-xs text-gray-400 font-mono">{log.itemId}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        log.action === 'checkout'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {log.action === 'checkout' ? 'Checkout' : 'Return'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                      {log.qty}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {log.durationMs !== undefined ? formatDuration(log.durationMs) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

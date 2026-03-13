import { useState, useEffect, useRef, useMemo } from 'react';
import { Item } from '../types/item';
import { itemsRepository } from '../services/itemsRepository';
import { isSameSupplier } from '../utils/helpers';

export interface FilterState {
  search: string;
  locations: string[];
  suppliers: string[];
  supplierUrl?: string;  // Filter by supplier URL
  lowStockOnly: boolean;
  lowStockThreshold: number;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  locations: [],
  suppliers: [],
  lowStockOnly: false,
  lowStockThreshold: 10,
};

/**
 * Hook to manage items with real-time updates from Firestore
 */
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to items on mount
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Safety net: if Firestore doesn't respond in 12s, clear loading
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError('Connection timed out. Check your network and try refreshing.');
    }, 12000);

    const clearTimeout_ = () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const unsubscribe = itemsRepository.subscribeToItems(
      (updatedItems) => {
        clearTimeout_();
        setItems(updatedItems);
        setLoading(false);
        setError(null);
      },
      (err) => {
        clearTimeout_();
        setLoading(false);
        setError('Failed to load items: ' + err.message);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      clearTimeout_();
      unsubscribe();
    };
  }, []);

  // Get unique locations from all items
  const availableLocations = useMemo(() => {
    const allLocations = items.flatMap((item) => item.location || []);
    return Array.from(new Set(allLocations)).sort();
  }, [items]);

  // Get unique suppliers from all items
  const availableSuppliers = useMemo(() => {
    const allSuppliers = items.map((item) => item.supplier).filter(Boolean);
    return Array.from(new Set(allSuppliers)).sort();
  }, [items]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.supplier.toLowerCase().includes(searchLower) ||
          item.location.some((loc) => loc.toLowerCase().includes(searchLower))
      );
    }

    // Location filter
    if (filters.locations.length > 0) {
      result = result.filter((item) =>
        item.location.some((loc) => filters.locations.includes(loc))
      );
    }

    // Supplier filter
    if (filters.suppliers.length > 0) {
      result = result.filter((item) => filters.suppliers.includes(item.supplier));
    }

    // Supplier URL filter (filter by same company)
    if (filters.supplierUrl) {
      result = result.filter((item) =>
        item.supplier_url && isSameSupplier(item.supplier_url, filters.supplierUrl!)
      );
    }

    // Low stock filter
    if (filters.lowStockOnly) {
      result = result.filter(
        (item) =>
          item.on_hand !== undefined &&
          item.on_hand < filters.lowStockThreshold
      );
    }

    return result;
  }, [items, filters]);

  // Update filters
  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Refresh items manually — does a silent one-shot fetch without a loading spinner
  // (the onSnapshot listener keeps data live; this just forces a round-trip)
  const refresh = async () => {
    try {
      setError(null);
      await itemsRepository.getAllItems();
    } catch (err) {
      setError('Failed to refresh items');
      console.error(err);
    }
  };

  return {
    items: filteredItems,
    allItems: items,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    availableLocations,
    availableSuppliers,
    refresh,
  };
}

/**
 * Hook to get a single item by ID
 */
export function useItem(id: string | undefined) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    itemsRepository
      .getItem(id)
      .then((fetchedItem) => {
        setItem(fetchedItem);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load item');
        setLoading(false);
        console.error(err);
      });
  }, [id]);

  return { item, loading, error };
}

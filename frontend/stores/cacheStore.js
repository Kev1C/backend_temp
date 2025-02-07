//frontend/stores/cacheStore.js
import { create } from 'zustand';

const DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

// Utility to evict least recently used items if the cache exceeds its maxSize
const evictLRUItems = (dataMap, timeoutMap, maxSize) => {
  if (dataMap.size < maxSize) return;
  
  // Build an array of [key, { timestamp, value }]
  const entries = Array.from(dataMap.entries());
  // Sort entries by timestamp ascending (oldest used first)
  entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
  
  // Remove a fraction (20%) of the oldest items
  const itemsToRemove = Math.ceil(maxSize * 0.2);
  for (let i = 0; i < itemsToRemove; i++) {
    const key = entries[i][0];
    dataMap.delete(key);
    if (timeoutMap.has(key)) {
      clearTimeout(timeoutMap.get(key));
      timeoutMap.delete(key);
    }
  }
};

export const cacheStore = create((set, get) => ({
  data: new Map(),
  lastFetch: new Map(),
  maxSize: 200, // maximum number of items in cache

  get: (key) => {
    const { data, lastFetch } = get();
    const cacheEntry = data.get(key);
    if (!cacheEntry) return null;
    
    const ttl = cacheEntry.ttl || DEFAULT_TTL;
    if (Date.now() - cacheEntry.timestamp > ttl) {
      get().invalidate(key);
      return null;
    }
    return cacheEntry.value;
  },

  set: (key, value, ttl = DEFAULT_TTL) => {
    const { data, lastFetch, maxSize } = get();

    // Evict items if cache is full
    evictLRUItems(data, lastFetch, maxSize);

    // Set the new cache entry
    const cacheEntry = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    data.set(key, cacheEntry);
    
    // Clear previous timeout, if any
    if (lastFetch.has(key)) {
      clearTimeout(lastFetch.get(key));
    }
    
    // Set a timeout to auto-remove this item when its TTL is reached
    const timeout = setTimeout(() => {
      data.delete(key);
      lastFetch.delete(key);
      set({ data, lastFetch });
    }, ttl);
    lastFetch.set(key, timeout);
    
    set({ data, lastFetch });
  },

  invalidate: (key) => {
    const { data, lastFetch } = get();
    data.delete(key);
    if (lastFetch.has(key)) {
      clearTimeout(lastFetch.get(key));
      lastFetch.delete(key);
    }
    set({ data, lastFetch });
  },

  clearAll: () => {
    const { data, lastFetch } = get();
    data.forEach((_, key) => {
      if (lastFetch.has(key)) {
        clearTimeout(lastFetch.get(key));
      }
    });
    set({
      data: new Map(),
      lastFetch: new Map(),
    });
  }
}));

// Export the hook for component usage
export const useCacheStore = cacheStore;

// Export individual actions and state for direct access
export const {
  getState,
  setState,
  subscribe,
  destroy
} = cacheStore;
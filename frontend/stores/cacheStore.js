//frontend/stores/cacheStore.js
import { create } from 'zustand';

const DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

const evictLRUItems = (dataMap, timeoutMap, maxSize) => {
  if (dataMap.size < maxSize) return;
  const entries = Array.from(dataMap.entries());
  entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
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
  maxSize: 200,
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
    evictLRUItems(data, lastFetch, maxSize);
    const cacheEntry = { value, timestamp: Date.now(), ttl };
    data.set(key, cacheEntry);
    if (lastFetch.has(key)) {
      clearTimeout(lastFetch.get(key));
    }
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
    set({ data: new Map(), lastFetch: new Map() });
  }
}));

export const useCacheStore = cacheStore;

export const {
  getState,
  setState,
  subscribe,
  destroy
} = cacheStore;

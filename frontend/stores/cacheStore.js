import { create } from 'zustand';

const DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export const cacheStore = create((set, get) => ({
  data: new Map(),
  lastFetch: new Map(),

  get: (key) => {
    const { data, lastFetch } = get();
    const lastFetchTime = lastFetch.get(key);
    const cachedData = data.get(key);

    if (!lastFetchTime || !cachedData) {
      return null;
    }

    const ttl = cachedData.ttl || DEFAULT_TTL;
    if (Date.now() - lastFetchTime > ttl) {
      // Cache expired
      get().invalidate(key);
      return null;
    }

    return cachedData.value;
  },

  set: (key, value, ttl = DEFAULT_TTL) => {
    const { data, lastFetch } = get();
    data.set(key, { value, ttl });
    lastFetch.set(key, Date.now());
    set({ data, lastFetch });
  },

  invalidate: (key) => {
    const { data, lastFetch } = get();
    data.delete(key);
    lastFetch.delete(key);
    set({ data, lastFetch });
  },

  clearAll: () => {
    set({
      data: new Map(),
      lastFetch: new Map()
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

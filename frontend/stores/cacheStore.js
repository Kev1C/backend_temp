import { create } from 'zustand';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const cacheStore = create((set, get) => ({
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

    set({
      data: new Map(data),
      lastFetch: new Map(lastFetch),
    });
  },

  invalidate: (key) => {
    const { data, lastFetch } = get();
    
    data.delete(key);
    lastFetch.delete(key);

    set({
      data: new Map(data),
      lastFetch: new Map(lastFetch),
    });
  },

  clearAll: () => {
    set({
      data: new Map(),
      lastFetch: new Map(),
    });
  },
}));

export const useCacheStore = () => cacheStore();

// Export individual actions and state for direct access
export const {
  getState,
  setState,
  subscribe
} = cacheStore;

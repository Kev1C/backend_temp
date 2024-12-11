// frontend/stores/cacheStore.ts
import { create } from 'zustand';
import { CacheState } from '../types/store';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const useCacheStore = create<CacheState>((set, get) => ({
  data: new Map(),
  lastFetch: new Map(),

  get: <T>(key: string): T | null => {
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

    return cachedData.value as T;
  },

  set: <T>(key: string, value: T, ttl: number = DEFAULT_TTL): void => {
    const { data, lastFetch } = get();
    
    data.set(key, { value, ttl });
    lastFetch.set(key, Date.now());

    set({
      data: new Map(data),
      lastFetch: new Map(lastFetch),
    });
  },

  invalidate: (key: string): void => {
    const { data, lastFetch } = get();
    
    data.delete(key);
    lastFetch.delete(key);

    set({
      data: new Map(data),
      lastFetch: new Map(lastFetch),
    });
  },

  clearAll: (): void => {
    set({
      data: new Map(),
      lastFetch: new Map(),
    });
  },
}));

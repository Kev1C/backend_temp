// frontend/stores/nutritionStore.ts
import { create } from 'zustand';
import { api } from '../services/api';
import { NutritionState, DailyNutrition } from '../types/store';
import { useCacheStore } from './cacheStore';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const formatDate = (date: Date): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useNutritionStore = create<NutritionState>((set, get) => ({
  dailyNutrition: null,
  isLoading: false,
  error: null,
  cache: new Map(),
  lastFetch: new Map(),

  fetchDailyNutrition: async (date: Date, force: boolean = false): Promise<DailyNutrition> => {
    const formattedDate = formatDate(date);
    const cacheKey = formattedDate;

    if (!force) {
      const cachedData = useCacheStore.getState().get<DailyNutrition>(`nutrition_${cacheKey}`);
      if (cachedData) {
        set({ dailyNutrition: cachedData });
        return cachedData;
      }
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.get(`/api/nutrition/daily/${formattedDate}`);
      const nutritionData: DailyNutrition = response.data;

      useCacheStore.getState().set(`nutrition_${cacheKey}`, nutritionData);

      set({
        dailyNutrition: nutritionData,
        isLoading: false,
      });

      return nutritionData;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  updateDailyNutrition: async (date: Date, nutritionData: Partial<DailyNutrition>): Promise<DailyNutrition> => {
    const formattedDate = formatDate(date);

    set({ isLoading: true, error: null });

    try {
      const response = await api.post(`/api/nutrition/daily/${formattedDate}`, nutritionData);
      const updatedData: DailyNutrition = response.data;

      useCacheStore.getState().set(`nutrition_${formattedDate}`, updatedData);

      set({
        dailyNutrition: updatedData,
        isLoading: false,
      });

      return updatedData;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  clearCache: () => {
    set({
      cache: new Map(),
      lastFetch: new Map(),
    });
    // Also clear nutrition-related entries from the global cache
    const cacheStore = useCacheStore.getState();
    Array.from(cacheStore.data.keys())
      .filter(key => key.startsWith('nutrition_'))
      .forEach(key => cacheStore.invalidate(key));
  },
}));

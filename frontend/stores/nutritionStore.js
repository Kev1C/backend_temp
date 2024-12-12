// frontend/stores/nutritionStore.js
import { create } from 'zustand';
import { api } from '../services/api';
import { cacheStore } from './cacheStore';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const nutritionStore = create((set, get) => ({
  dailyNutrition: null,
  isLoading: false,
  error: null,

  fetchDailyNutrition: async (date, force = false) => {
    const formattedDate = formatDate(date);
    const cacheKey = `nutrition_${formattedDate}`;

    if (!force) {
      const cachedData = cacheStore.getState().get(cacheKey);
      if (cachedData) {
        console.log('Using cached nutrition data for:', formattedDate);
        set({ dailyNutrition: cachedData, isLoading: false });
        return cachedData;
      }
    }

    set({ isLoading: true, error: null });

    try {
      console.log('Fetching nutrition data for:', formattedDate);
      const response = await api.get(`/nutrition/daily/${formattedDate}`);
      const data = response.data;

      // Store in cache
      cacheStore.getState().set(cacheKey, data, CACHE_DURATION);
      
      set({ dailyNutrition: data, isLoading: false });
      return data;
    } catch (err) {
      console.error('Error fetching nutrition:', err);
      const error = err.message || 'Failed to fetch daily nutrition';
      set({ error, isLoading: false });
      throw new Error(error);
    }
  },

  updateDailyNutrition: async () => {
    const today = new Date();
    return get().fetchDailyNutrition(today, true);
  },

  clearCache: () => {
    cacheStore.getState().clearAll();
  }
}));

// Export the hook for component usage
export const useNutritionStore = nutritionStore;

// Export individual actions and state for direct access
export const {
  getState,
  setState,
  subscribe,
  destroy
} = nutritionStore;

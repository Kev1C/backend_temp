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
  currentDate: null,
  isLoading: false,
  error: null,

  fetchDailyNutrition: async (date, force = false) => {
    const formattedDate = formatDate(date);
    const cacheKey = `nutrition_${formattedDate}`;
    const state = get();

    // Check if we already have this date's data in state
    if (!force && state.dailyNutrition && state.currentDate === formattedDate) {
      console.log('Using in-memory nutrition data for:', formattedDate);
      return state.dailyNutrition;
    }

    // Check cache
    if (!force) {
      const cachedData = cacheStore.getState().get(cacheKey);
      if (cachedData) {
        console.log('Using cached nutrition data for:', formattedDate);
        set({ dailyNutrition: cachedData, currentDate: formattedDate, isLoading: false });
        return cachedData;
      }
    }

    set({ isLoading: true, error: null });

    try {
      console.log('Fetching nutrition data for:', formattedDate);
      
      const response = await api.get(`/nutrition/daily/${formattedDate}`);
      const data = response.data;

      // Store in cache and state
      cacheStore.getState().set(cacheKey, data, CACHE_DURATION);
      set({ dailyNutrition: data, currentDate: formattedDate, isLoading: false });
      
      return data;
    } catch (err) {
      console.error('Error in nutrition store:', err);
      const emptyData = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: []
      };
      set({ dailyNutrition: emptyData, currentDate: formattedDate, error: err.message, isLoading: false });
      return emptyData;
    }
  },

  updateDailyNutrition: async (date, newMeal) => {
    const formattedDate = formatDate(date);
    const cacheKey = `nutrition_${formattedDate}`;
    const currentData = get().dailyNutrition || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      meals: []
    };

    // Calculate new totals
    const updatedData = {
      ...currentData,
      calories: currentData.calories + (newMeal.calories || 0),
      protein: currentData.protein + (newMeal.protein || 0),
      carbs: currentData.carbs + (newMeal.carbs || 0),
      fat: currentData.fat + (newMeal.fat || 0),
      meals: [...currentData.meals, newMeal]
    };

    // Update state immediately
    set({ dailyNutrition: updatedData, currentDate: formattedDate });

    // Update cache before server call
    cacheStore.getState().set(cacheKey, updatedData, CACHE_DURATION);

    try {
      // Save to server
      await api.post(`/nutrition/daily/${formattedDate}`, updatedData);
    } catch (error) {
      console.error('Failed to save nutrition data:', error);
      // Keep the optimistic update even if server fails
    }

    return updatedData;
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

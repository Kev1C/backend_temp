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
  nutritionalGoals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  },
  currentDate: null,
  isLoading: false,
  error: null,

  setNutritionalGoals: (goals) => {
    set({ nutritionalGoals: goals });
  },

  fetchDailyNutrition: async (date, force = false) => {
    const formattedDate = formatDate(date);
    const cacheKey = `nutrition_${formattedDate}`;
    const state = get();

    if (!force && state.dailyNutrition && state.currentDate === formattedDate) {
      return state.dailyNutrition;
    }

    if (!force) {
      const cachedData = cacheStore.getState().get(cacheKey);
      if (cachedData) {
        set({ dailyNutrition: cachedData, currentDate: formattedDate, isLoading: false });
        return cachedData;
      }
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.get(`/nutrition/daily/${formattedDate}`);
      const data = response.data;
      
      // Store the data in cache and state
      cacheStore.getState().set(cacheKey, data);
      set({ 
        dailyNutrition: data, 
        currentDate: formattedDate, 
        isLoading: false 
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching daily nutrition:', error);
      set({ 
        error: 'Failed to fetch daily nutrition data',
        isLoading: false 
      });
      return null;
    }
  },

  updateDailyNutrition: async (date, newMeal) => {
    const formattedDate = formatDate(date);
    set({ isLoading: true, error: null });

    try {
      const response = await api.post(`/nutrition/daily/${formattedDate}`, newMeal);
      const data = response.data;

      set({ 
        dailyNutrition: data,
        currentDate: formattedDate,
        isLoading: false
      });

      return data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message || 'Failed to update nutrition data'
      });
      throw error;
    }
  },

  clearCache: () => {
    cacheStore.getState().clear();
    set({ dailyNutrition: null, currentDate: null });
  }
}));

export const useNutritionStore = nutritionStore;

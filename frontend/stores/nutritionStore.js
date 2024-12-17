// frontend/stores/nutritionStore.js
import { create } from 'zustand';
import { api } from '../services/api';
import { cacheStore } from './cacheStore';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useNutritionStore = create((set, get) => ({
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

    // Return state data if available and not forced
    if (!force && state.dailyNutrition && state.currentDate === formattedDate) {
      return state.dailyNutrition;
    }

    // Return cached data if available and not forced
    if (!force) {
      const cachedData = cacheStore.getState().get(cacheKey);
      if (cachedData) {
        set({ 
          dailyNutrition: cachedData, 
          currentDate: formattedDate, 
          isLoading: false 
        });
        return cachedData;
      }
    }

    // Only set loading if we're actually going to fetch
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
    const cacheKey = `nutrition_${formattedDate}`;
    set({ isLoading: true, error: null });

    try {
      // Get current nutrition data
      let currentData = get().dailyNutrition;
      
      // If no current data, try to fetch from cache first
      if (!currentData) {
        currentData = cacheStore.getState().get(cacheKey) || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals: []
        };
      }

      // Calculate new totals
      const updatedData = {
        calories: Number(currentData.calories || 0) + Number(newMeal.calories || 0),
        protein: Number(currentData.protein || 0) + Number(newMeal.protein || 0),
        carbs: Number(currentData.carbs || 0) + Number(newMeal.carbs || 0),
        fat: Number(currentData.fat || 0) + Number(newMeal.fats || 0),
        meals: [...(currentData.meals || []), newMeal]
      };

      // Update cache and state immediately for optimistic updates
      cacheStore.getState().set(cacheKey, updatedData);
      set({ 
        dailyNutrition: updatedData,
        currentDate: formattedDate,
        isLoading: false
      });

      // Send update to backend
      const response = await api.post(`/nutrition/daily/${formattedDate}`, {
        meal: newMeal,
        totals: {
          calories: updatedData.calories,
          protein: updatedData.protein,
          carbs: updatedData.carbs,
          fats: updatedData.fat
        }
      });
      
      if (response.data && !isEqual(response.data, updatedData)) {
        // Update with server data if different
        cacheStore.getState().set(cacheKey, response.data);
        set({ 
          dailyNutrition: response.data,
          currentDate: formattedDate,
          isLoading: false
        });
      }

      return updatedData;
    } catch (error) {
      console.error('Error updating nutrition data:', error);
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

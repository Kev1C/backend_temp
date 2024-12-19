// frontend/stores/nutritionStore.js
import { create } from 'zustand';
import { api } from '../services/api';
import { cacheStore } from './cacheStore';
import { isEqual } from 'lodash';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Export the formatDate function so it can be used by other components
export const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useNutritionStore = create((set, get) => ({
  dailyNutrition: null,
  nutritionalGoals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  },
  currentDate: null,
  isLoading: false,
  error: null,
  formatDate, // Add formatDate to the store
  pendingRequests: new Map(), // Track ongoing requests to prevent duplicates
  visitedDates: new Set(), // Track visited dates to optimize cache

  setNutritionalGoals: (goals) => {
    set({ nutritionalGoals: goals });
  },

  fetchDailyNutrition: async (date, force = false) => {
    const formattedDate = formatDate(date);
    const cacheKey = `nutrition_${formattedDate}`;
    const state = get();

    // Return state data if available and not forced
    if (!force && state.dailyNutrition && state.currentDate === formattedDate) {
      console.log('Using existing data for:', formattedDate);
      return state.dailyNutrition;
    }

    // Check cache first
    const cache = cacheStore.getState();
    const cachedData = cache.get(cacheKey);
    if (!force && cachedData) {
      console.log('Using cached data for:', formattedDate);
      set({ 
        dailyNutrition: cachedData,
        currentDate: formattedDate,
        isLoading: false 
      });
      return cachedData;
    }

    // Check if there's already a pending request for this date
    const pendingRequest = state.pendingRequests.get(formattedDate);
    if (pendingRequest) {
      console.log('Using pending request for:', formattedDate);
      return pendingRequest;
    }

    // Create the request promise
    const requestPromise = (async () => {
      console.log('Fetching from server for:', formattedDate);
      set({ isLoading: true, error: null });

      try {
        const response = await api.get(`/nutrition/daily/${formattedDate}`);
        const data = response.data;
        
        // Store the data in cache and state
        cache.set(cacheKey, data);
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
        throw error;
      } finally {
        // Clean up pending request
        state.pendingRequests.delete(formattedDate);
      }
    })();

    // Store the promise in pendingRequests
    state.pendingRequests.set(formattedDate, requestPromise);
    return requestPromise;
  },

  updateDailyNutrition: async (date, newMeal) => {
    // Ensure date is a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : new Date();
    const formattedDate = formatDate(dateObj);
    const cacheKey = `nutrition_${formattedDate}`;
    set({ isLoading: true, error: null });

    try {
      // Get current nutrition data
      let currentData = get().dailyNutrition;
      
      // If no current data, initialize with zeros
      if (!currentData || get().currentDate !== formattedDate) {
        currentData = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          meals: []
        };
      }

      // Validate required fields
      if (!newMeal.name || !newMeal.image || !newMeal.time) {
        throw new Error('Missing required fields: name, image, or time');
      }

      // Send update to backend first
      const response = await api.post(`/nutrition/daily/${formattedDate}`, {
        meal: {
          ...newMeal,
          date: formattedDate
        }
      });
      
      // Update with server response and invalidate cache
      const serverData = response.data;
      cacheStore.getState().invalidate(cacheKey); // Use the invalidate method from cacheStore
      
      set({ 
        dailyNutrition: serverData,
        currentDate: formattedDate,
        isLoading: false
      });

      // Force a fresh fetch to ensure all components get updated data
      await get().fetchDailyNutrition(dateObj, true);

      return serverData;
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
    const cache = cacheStore.getState();
    cache.clearAll();
    set({ 
      dailyNutrition: null, 
      currentDate: null,
      visitedDates: new Set()
    });
  }
}));

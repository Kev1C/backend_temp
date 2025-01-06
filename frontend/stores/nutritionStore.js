// frontend/stores/nutritionStore.js
import { create } from 'zustand';
import { api } from '../services/api';
import { cacheStore } from './cacheStore';
import { isEqual } from 'lodash'; // Import isEqual if you need to use it for comparisons

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (Adjust if needed)

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
  pendingRequests: new Map(), // Track ongoing requests to prevent duplicates (from notworking)
  visitedDates: new Set(), // Track visited dates to optimize cache (from notworking)
  heatmapData: {}, // from notworking
  isLoadingHeatmap: false, // from notworking
  heatmapError: null, // from notworking
  currentStreak: 0, // from notworking

  // Calculate streak (from notworking)
  calculateStreak: (heatmapData, goals) => {
    if (!heatmapData || Object.keys(heatmapData).length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = formatDate(currentDate);
      const dayData = heatmapData[dateStr];

      if (!dayData || dayData.value < goals.calories) {
        break;
      }

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  },

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

    // Check if there's already a pending request for this date (from notworking)
    const pendingRequest = state.pendingRequests.get(formattedDate);
    if (pendingRequest) {
      console.log('Using pending request for:', formattedDate);
      return pendingRequest;
    }

    // Create the request promise (from notworking)
    const requestPromise = (async () => {
      console.log('Fetching from server for:', formattedDate);
      set({ isLoading: true, error: null });

      try {
        const response = await api.get(`/nutrition/daily/${formattedDate}`);
        const data = response.data;

        // Store the data in cache and state
        cache.set(cacheKey, data, CACHE_DURATION); // Using CACHE_DURATION
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
        // Clean up pending request (from notworking)
        state.pendingRequests.delete(formattedDate);
      }
    })();

    // Store the promise in pendingRequests (from notworking)
    state.pendingRequests.set(formattedDate, requestPromise);
    return requestPromise;
  },

  updateDailyNutrition: async (date, newMeal) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date();
    const formattedDate = formatDate(dateObj);
    const cacheKey = `nutrition_${formattedDate}`;
    set({ isLoading: true, error: null });

    try {
      // Validate required fields
      if (!newMeal.name || !newMeal.image || !newMeal.time) {
        throw new Error('Missing required fields: name, image, or time');
      }

      // Send update to backend
      const response = await api.post(`/nutrition/daily/${formattedDate}`, {
        meal: {
          ...newMeal,
          date: formattedDate
        }
      });

      // Update with server response and invalidate cache
      const serverData = response.data;
      cacheStore.getState().invalidate(cacheKey);

      set({
        dailyNutrition: serverData,
        currentDate: formattedDate,
        isLoading: false
      });

      // Force a fresh fetch
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

  // Fetch heatmap data (from notworking)
  fetchHeatmapData: async (startDate, endDate) => {
    set({ isLoadingHeatmap: true, heatmapError: null });

    try {
      // Clear old heatmap data when fetching new data
      set({ heatmapData: {} });

      const response = await api.get('/nutrition/heatmap', {
        params: { startDate, endDate }
      });

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid data format received from server');
      }

      const heatmapData = response.data;
      const goals = get().nutritionalGoals;
      const streak = get().calculateStreak(heatmapData, goals);

      set({
        heatmapData,
        currentStreak: streak,
        isLoadingHeatmap: false
      });

      return heatmapData;
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      set({
        heatmapError: error.message || 'Failed to fetch heatmap data',
        isLoadingHeatmap: false
      });
      return null;
    }
  },

  // Get monthly nutrition (from notworking)
  getMonthlyNutrition: async (year, month) => {
    const cacheKey = `monthly-nutrition-${year}-${month}`;
    const cachedData = cacheStore.getState().get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await api.get(`/nutrition/monthly/${year}/${month}`);
      const data = response.data;

      // Cache the monthly data
      cacheStore.getState().set(cacheKey, data, CACHE_DURATION);

      return data;
    } catch (error) {
      console.error(`Error fetching monthly nutrition for ${year}-${month}:`, error);
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
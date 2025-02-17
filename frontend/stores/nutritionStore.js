// frontend/stores/nutritionStore.js
import { create } from 'zustand';
import { api } from '../services/api';
import { cacheStore } from './cacheStore';
import { isEqual } from 'lodash'; // Import isEqual if you need to use it for comparisons
import { useAuthStore } from './authStore';

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
    
    // Return current state if available – avoid duplicate calls unless forced
    if (!force && state.dailyNutrition && state.currentDate === formattedDate) {
      console.log('Using existing state data for:', formattedDate);
      return Promise.resolve(state.dailyNutrition);
    }

    // Return cached version (if available and fresh) before doing any network call
    const cache = cacheStore.getState();
    const cachedData = cache.get(cacheKey);
    if (!force && cachedData) {
      console.log('Using cached data for:', formattedDate);
      set({
        dailyNutrition: cachedData,
        currentDate: formattedDate,
        isLoading: false
      });
      return Promise.resolve(cachedData);
    }

    // Check for a pending request and return it rather than firing a duplicate call
    if (state.pendingRequests.has(formattedDate)) {
      console.log('Returning pending request for:', formattedDate);
      return state.pendingRequests.get(formattedDate);
    }

    // Create and store the new request promise
    const requestPromise = (async () => {
      console.log('Fetching from server for:', formattedDate);
      set({ isLoading: true, error: null });
      try {
        const response = await api.get(`/nutrition/daily/${formattedDate}`);
        const data = response.data;

        // Update cache and state:
        cache.set(cacheKey, data, CACHE_DURATION);
        set({
          dailyNutrition: data,
          currentDate: formattedDate,
          isLoading: false
        });
        return data;
      } catch (error) {
        console.error('Error fetching daily nutrition:', error);
        set({ error: 'Failed to fetch daily nutrition data', isLoading: false });
        throw error;
      } finally {
        // Remove this pending request whether it succeeded or failed
        state.pendingRequests.delete(formattedDate);
      }
    })();

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
      await useAuthStore.getState().ensureValidToken();
      const response = await api.post(`/nutrition/daily/${formattedDate}`, {
          headers: { Authorization: `Bearer ${useAuthStore.getState().authToken}` },
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
    const cacheKey = `heatmap_${startDate}-${endDate}`;
    const cached = cacheStore.getState().get(cacheKey);
    if (cached) {
      const goals = get().nutritionalGoals;
      const streak = get().calculateStreak(cached, goals);
      set({
        heatmapData: cached,
        currentStreak: streak,
        isLoadingHeatmap: false
      });
      return cached;
    }

    set({ isLoadingHeatmap: true, heatmapError: null });

    try {
      // Clear old heatmap data when fetching new data
      set({ heatmapData: {} });

      await useAuthStore.getState().ensureValidToken();
      const response = await api.get('/nutrition/heatmap', {
        headers: { Authorization: `Bearer ${useAuthStore.getState().authToken}` },
        params: { startDate, endDate }
      });

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid data format received from server');
      }

      const heatmapData = response.data;
      cacheStore.getState().set(cacheKey, heatmapData, CACHE_DURATION); // Cache the data
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
      await useAuthStore.getState().ensureValidToken();
      const response = await api.get(`/nutrition/monthly/${year}/${month}`,{
        headers: { Authorization: `Bearer ${useAuthStore.getState().authToken}` },
      });
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
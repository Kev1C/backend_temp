// frontend/stores/nutritionStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { cacheStore } from './cacheStore';

// TTL values
//const DAILY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DAILY_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 5 minutes
const LONG_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useNutritionStore = create((set, get) => ({
  dailyNutrition: null,
  nutritionalGoals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
  currentDate: null,
  isLoading: false,
  error: null,
  formatDate,
  pendingRequests: new Map(),
  visitedDates: new Set(),
  heatmapData: {},
  isLoadingHeatmap: false,
  heatmapError: null,
  currentStreak: 0,

  calculateStreak: (heatmapData, goals) => {
    if (!heatmapData || Object.keys(heatmapData).length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);
    while (true) {
      const dateStr = formatDate(currentDate);
      const dayData = heatmapData[dateStr];
      if (!dayData || dayData.value < goals.calories) break;
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    return streak;
  },

  setNutritionalGoals: (goals) => set({ nutritionalGoals: goals }),

  // Updated fetchDailyNutrition using a stale-while-revalidate strategy.
  fetchDailyNutrition: async (date, force = false) => {
    const formattedDate = formatDate(date);
    const cacheKey = `nutrition_${formattedDate}`;
    const state = get();

    // If already loaded in state for this date (and we are not forcing a refresh), use it.
    if (!force && state.dailyNutrition && state.currentDate === formattedDate) {
      console.log('Using existing state data for:', formattedDate);
      return Promise.resolve(state.dailyNutrition);
    }

    // Try to retrieve persisted data (if not forcing).
    if (!force) {
      try {
        const persisted = await AsyncStorage.getItem(cacheKey);
        if (persisted) {
          const parsed = JSON.parse(persisted);
          if (Date.now() - parsed.timestamp < DAILY_CACHE_DURATION) {
            console.log('Using persisted nutrition data for:', formattedDate);
            set({ 
              dailyNutrition: parsed.data, 
              currentDate: formattedDate, 
              isLoading: false 
            });
            // Trigger a background revalidation.
            (async () => {
              try {
                const response = await api.getDailyNutrition(formattedDate);
                const freshData = response.data;
                cacheStore.getState().set(cacheKey, freshData, LONG_CACHE_DURATION);
                set({ dailyNutrition: freshData, currentDate: formattedDate });
                try {
                  await AsyncStorage.setItem(
                    cacheKey, 
                    JSON.stringify({ data: freshData, timestamp: Date.now() })
                  );
                } catch (err) {
                  console.error('Error persisting nutrition data:', err);
                }
              } catch (err) {
                console.error('Background fetch error for nutrition data:', err);
              }
            })();
            return parsed.data;
          }
        }
      } catch (err) {
        console.error('Error reading persisted nutrition data:', err);
      }
    }

    // If there is a pending request for this date, return it.
    if (state.pendingRequests.has(formattedDate)) {
      console.log('Returning pending request for:', formattedDate);
      return state.pendingRequests.get(formattedDate);
    }

    // No valid cache found (or force is true), do a network fetch.
    const requestPromise = (async () => {
      console.log('Fetching from server for:', formattedDate);
      set({ isLoading: true, error: null });
      try {
        const response = await api.getDailyNutrition(formattedDate);
        const data = response.data;
        // Update the in-memory cacheStore.
        cacheStore.getState().set(cacheKey, data, LONG_CACHE_DURATION);
        set({ dailyNutrition: data, currentDate: formattedDate, isLoading: false });
        try {
          await AsyncStorage.setItem(
            cacheKey, 
            JSON.stringify({ data, timestamp: Date.now() })
          );
        } catch (err) {
          console.error('Error persisting nutrition data:', err);
        }
        return data;
      } catch (error) {
        console.error('Error fetching daily nutrition:', error);
        set({ error: 'Failed to fetch daily nutrition data', isLoading: false });
        throw error;
      } finally {
        state.pendingRequests.delete(formattedDate);
      }
    })();
    state.pendingRequests.set(formattedDate, requestPromise);
    return requestPromise;
  },

  updateDailyNutrition: async (date, newMeal) => {
    // Create a Date object if date is a string.
    const dateObj = typeof date === 'string' ? new Date(date) : date || new Date();
    const formattedDate = formatDate(dateObj);
    const cacheKey = `nutrition_${formattedDate}`;
    set({ isLoading: true, error: null });
    try {
      let serverData;
      if (newMeal) {
        if (!newMeal.name || !newMeal.image || !newMeal.time) {
          throw new Error('Missing required fields: name, image, or time');
        }
        const response = await api.addMeal({
          ...newMeal, 
          date: formattedDate
        });
        serverData = response.data;
      } else {
        const response = await api.getDailyNutrition(formattedDate);
        serverData = response.data;
      }
      // Invalidate caches immediately.
      cacheStore.getState().invalidate(cacheKey);
      set({ dailyNutrition: serverData, currentDate: formattedDate, isLoading: false });
      try {
        await AsyncStorage.removeItem(cacheKey);
      } catch (err) {
        console.error('Error removing persisted nutrition data:', err);
      }
      // Now force a fresh network fetch to update state.
      await get().fetchDailyNutrition(dateObj, true);
      return serverData;
    } catch (error) {
      console.error('Error updating nutrition data:', error);
      set({ isLoading: false, error: error.message || 'Failed to update nutrition data' });
      throw error;
    }
  },

  fetchHeatmapData: async (startDate, endDate) => {
    const cacheKey = `heatmap_${startDate}-${endDate}`;
    const cached = cacheStore.getState().get(cacheKey);
    if (cached) {
      const goals = get().nutritionalGoals;
      const streak = get().calculateStreak(cached, goals);
      set({ heatmapData: cached, currentStreak: streak, isLoadingHeatmap: false });
      return cached;
    }
    set({ isLoadingHeatmap: true, heatmapError: null });
    try {
      set({ heatmapData: {} });
      const response = await api.getNutritionSummary({ startDate, endDate });
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid data format received from server');
      }
      const heatmapData = response.data;
      cacheStore.getState().set(cacheKey, heatmapData, LONG_CACHE_DURATION);
      const goals = get().nutritionalGoals;
      const streak = get().calculateStreak(heatmapData, goals);
      set({ heatmapData, currentStreak: streak, isLoadingHeatmap: false });
      return heatmapData;
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      set({ heatmapError: error.message || 'Failed to fetch heatmap data', isLoadingHeatmap: false });
      return null;
    }
  },

  getMonthlyNutrition: async (year, month) => {
    const cacheKey = `monthly-nutrition-${year}-${month}`;
    const cachedData = cacheStore.getState().get(cacheKey);
    if (cachedData) return cachedData;
    try {
      const response = await api.getNutritionSummary({ year, month });
      const data = response.data;
      cacheStore.getState().set(cacheKey, data, LONG_CACHE_DURATION);
      return data;
    } catch (error) {
      console.error(`Error fetching monthly nutrition for ${year}-${month}:`, error);
      throw error;
    }
  },

  clearCache: () => {
    const cache = cacheStore.getState();
    cache.clearAll();
    set({ dailyNutrition: null, currentDate: null, visitedDates: new Set() });
  }
}));

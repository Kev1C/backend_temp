import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const useNutrientStore = create((set, get) => ({
  calculatedNutrients: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },
  loading: false,
  error: null,
  lastFetch: null,

  fetchCalculations: async (force = false) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ loading: false });
      return;
    }

    // Check if we need to fetch again
    if (!force && get().lastFetch) {
      const timeSinceLastFetch = Date.now() - get().lastFetch;
      if (timeSinceLastFetch < CACHE_DURATION) {
        return;
      }
    }

    set({ loading: true, error: null });

    try {
      const response = await api.get('/nutrition/calculations');
      const data = response.data;

      set({
        calculatedNutrients: data,
        loading: false,
        lastFetch: Date.now()
      });
    } catch (err) {
      set({
        error: err.message || 'Failed to fetch nutrient calculations',
        loading: false
      });
    }
  },

  setCalculations: (nutrients) => {
    set({
      calculatedNutrients: nutrients,
      lastFetch: Date.now()
    });
  }
}));

export default useNutrientStore;

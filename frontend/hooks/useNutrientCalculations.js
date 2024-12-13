import { create } from 'zustand';
import { api } from '../services/api';

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

  fetchCalculations: async (user, force = false) => {
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
      // Include user's data in the request
      const response = await api.get('/nutrition/calculations', {
        params: {
          gender: user.gender,
          weight: user.weight,
          height: user.height,
          fitnessGoal: user.fitnessGoal
        }
      });
      
      const data = response.data;
      
      // Ensure we have all required nutrient values
      const nutrients = {
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0
      };

      set({
        calculatedNutrients: nutrients,
        loading: false,
        lastFetch: Date.now()
      });
    } catch (err) {
      console.error('Failed to fetch nutrient calculations:', err);
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

// Create a custom hook that returns the store's state and actions
const useNutrientCalculations = () => {
  const store = useNutrientStore();
  return {
    calculatedNutrients: store.calculatedNutrients,
    loading: store.loading,
    error: store.error,
    fetchCalculations: store.fetchCalculations,
    setCalculations: store.setCalculations
  };
};

export default useNutrientCalculations;

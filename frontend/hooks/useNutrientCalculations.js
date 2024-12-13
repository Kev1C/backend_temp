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

  fetchCalculations: async (userData, force = false) => {
    if (!userData) {
      set({ loading: false });
      return;
    }

    // Check if we need to fetch again
    if (!force && get().lastFetch) {
      const timeSinceLastFetch = Date.now() - get().lastFetch;
      if (timeSinceLastFetch < CACHE_DURATION) {
        return get().calculatedNutrients;
      }
    }

    set({ loading: true, error: null });

    try {
      // Include user's data in the request
      const response = await api.get('/nutrition/calculations', {
        params: {
          gender: userData.gender,
          weight: userData.weight,
          height: userData.height,
          fitnessGoal: userData.fitnessGoal || userData.goal // Support both field names
        }
      });
      
      const nutrients = {
        calories: response.data.calories || 0,
        protein: response.data.protein || 0,
        carbs: response.data.carbs || 0,
        fat: response.data.fat || 0
      };

      set({ 
        calculatedNutrients: nutrients,
        loading: false,
        lastFetch: Date.now(),
        error: null
      });

      return nutrients;
    } catch (error) {
      console.error('Failed to fetch nutrient calculations:', error);
      set({ 
        loading: false,
        error: error.message || 'Failed to fetch calculations'
      });
      return get().calculatedNutrients;
    }
  },

  setCalculations: (nutrients) => {
    set({ 
      calculatedNutrients: nutrients,
      lastFetch: Date.now(),
      error: null
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

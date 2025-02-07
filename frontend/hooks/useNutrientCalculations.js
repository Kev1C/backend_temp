//frontend/hooks/useNutrientCalculations.js
import { create } from 'zustand';
import { api } from '../services/api';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const useNutrientStore = create((set, get) => ({
  calculatedNutrients: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
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
      const response = await api.post('/nutrition/calculate', {
        gender: userData.gender,
        ageRange: userData.ageRange,
        weight: userData.weight,
        height: userData.height,
        activityLevel: userData.activityLevel,
        fitnessGoal: userData.fitnessGoal || userData.goal
      });
      
      const nutrients = {
        calories: response.data.calories || 0,
        protein: response.data.protein || 0,
        carbs: response.data.carbs || 0,
        fats: response.data.fats || 0
      };

      set({ 
        calculatedNutrients: nutrients,
        loading: false,
        lastFetch: Date.now(),
        error: null
      });

      return nutrients;
    } catch (error) {
      console.error('Error calculating nutrients:', error);
      set({ 
        loading: false,
        error: error.message || 'Failed to fetch calculations'
      });
      throw error;
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

const useNutrientCalculations = () => {
  const store = useNutrientStore();
  return {
    ...store,
    calculatedNutrients: store.calculatedNutrients,
    loading: store.loading,
    error: store.error
  };
};

export default useNutrientCalculations;

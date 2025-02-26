// frontend/hooks/useNutrientCalculations.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'nutrientCalculations';

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

    // If not forced, check AsyncStorage for cached nutrient data.
    if (!force) {
      try {
        const persisted = await AsyncStorage.getItem(STORAGE_KEY);
        if (persisted) {
          const parsed = JSON.parse(persisted); // Expected shape: { nutrients, timestamp }
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            console.log('Using persisted nutrient calculations data');
            // Set state with persisted data.
            set({
              calculatedNutrients: parsed.nutrients,
              lastFetch: parsed.timestamp,
              loading: false,
              error: null,
            });
            return parsed.nutrients;
          }
        }
      } catch (storageError) {
        console.error('Error retrieving persisted nutrient calculations:', storageError);
      }
    }

    // Fallback: Check if an in-memory fetch is recent enough.
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
        fitnessGoal: userData.fitnessGoal || userData.goal,
      });

      const nutrients = {
        calories: response.data.calories || 0,
        protein: response.data.protein || 0,
        carbs: response.data.carbs || 0,
        fats: response.data.fats || 0,
      };

      const now = Date.now();
      // Persist the nutrient calculations along with the current timestamp.
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ nutrients, timestamp: now })
      );

      set({
        calculatedNutrients: nutrients,
        loading: false,
        lastFetch: now,
        error: null,
      });

      return nutrients;
    } catch (error) {
      console.error('Error calculating nutrients:', error);
      set({ loading: false, error: error.message || 'Failed to fetch calculations' });
      throw error;
    }
  },

  setCalculations: (nutrients) => {
    const now = Date.now();
    set({
      calculatedNutrients: nutrients,
      lastFetch: now,
      error: null,
    });
    // Optionally update persisted data
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nutrients, timestamp: now })
    ).catch(err =>
      console.error('Error persisting nutrient calculations during setCalculations:', err)
    );
  }
}));

const useNutrientCalculations = () => {
  const store = useNutrientStore();
  return {
    ...store,
    calculatedNutrients: store.calculatedNutrients,
    loading: store.loading,
    error: store.error,
  };
};

export default useNutrientCalculations;

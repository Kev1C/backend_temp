import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCacheStore } from '../stores/cacheStore';
import { api } from '../services/api';
import { NutrientCalculationsHook } from '../types/hooks';

const CACHE_KEY = 'nutrientCalculations';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useNutrientCalculations = (): NutrientCalculationsHook => {
  const [calculatedNutrients, setCalculatedNutrients] = useState<NutrientCalculationsHook['calculatedNutrients']>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const cache = useCacheStore();

  useEffect(() => {
    const fetchNutrientCalculations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check cache first
        const cachedData = cache.get<NutrientCalculationsHook['calculatedNutrients']>(CACHE_KEY);
        if (cachedData) {
          setCalculatedNutrients(cachedData);
          setLoading(false);
          return;
        }

        const response = await api.get('/nutrition/calculations', {
          params: { userId: user.id },
        });

        const nutrients = response.data;
        setCalculatedNutrients(nutrients);
        cache.set(CACHE_KEY, nutrients, CACHE_DURATION);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch nutrient calculations');
      } finally {
        setLoading(false);
      }
    };

    fetchNutrientCalculations();
  }, [user, cache]);

  return {
    calculatedNutrients,
    loading,
    error,
  };
};

export default useNutrientCalculations;

import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCacheStore } from '../stores/cacheStore';
import { api } from '../services/api';
import { CalorieTrackerHook } from '../types/hooks';

const CACHE_KEY = 'calorieTracker';

export const useCalorieTracker = (): CalorieTrackerHook => {
  const [calories, setCalories] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const cache = useCacheStore();

  const addCalories = useCallback(async (amount: number) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const newTotal = calories + amount;
      setCalories(newTotal);

      const response = await api.post('/nutrition/calories', {
        userId: user.id,
        calories: amount,
      });

      cache.set(CACHE_KEY, newTotal);

      if (!response.data.success) {
        throw new Error('Failed to update calories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update calories');
      // Rollback on error
      setCalories(calories);
    } finally {
      setLoading(false);
    }
  }, [calories, user, cache]);

  const resetCalories = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await api.post('/nutrition/calories/reset', {
        userId: user.id,
      });

      setCalories(0);
      cache.set(CACHE_KEY, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset calories');
    } finally {
      setLoading(false);
    }
  }, [user, cache]);

  return {
    calories,
    addCalories,
    resetCalories,
    loading,
    error,
  };
};

export default useCalorieTracker;

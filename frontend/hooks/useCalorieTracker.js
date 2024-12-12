import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCacheStore } from '../stores/cacheStore';
import { api } from '../services/api';

const CACHE_KEY = 'calorieTracker';

export const useCalorieTracker = () => {
  const [calories, setCalories] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();
  const cache = useCacheStore();

  const addCalories = useCallback(async (amount) => {
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
    } catch (err) {
      setError(err.message || 'Failed to add calories');
      setCalories(calories); // Revert on error
    } finally {
      setLoading(false);
    }
  }, [calories, user, cache]);

  const subtractCalories = useCallback(async (amount) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const newTotal = Math.max(0, calories - amount);
      setCalories(newTotal);

      const response = await api.post('/nutrition/calories', {
        userId: user.id,
        calories: -amount,
      });

      cache.set(CACHE_KEY, newTotal);
    } catch (err) {
      setError(err.message || 'Failed to subtract calories');
      setCalories(calories); // Revert on error
    } finally {
      setLoading(false);
    }
  }, [calories, user, cache]);

  return {
    calories,
    loading,
    error,
    addCalories,
    subtractCalories,
  };
};

export default useCalorieTracker;

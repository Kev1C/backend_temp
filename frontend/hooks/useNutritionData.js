import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useCacheStore } from '../stores/cacheStore';
import { api } from '../services/api';

const MEALS_CACHE_KEY = 'recentMeals';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useNutritionData = () => {
  const [recentMeals, setRecentMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuthStore();
  const { dailyNutrition, fetchDailyNutrition, updateDailyNutrition } = useNutritionStore();
  const cache = useCacheStore();

  const fetchRecentMeals = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get('/nutrition/meals/recent');
      if (response.data) {
        setRecentMeals(response.data);
        cache.set(MEALS_CACHE_KEY, response.data, CACHE_DURATION);
      }
    } catch (err) {
      console.error('Error fetching recent meals:', err);
      const cachedMeals = cache.get(MEALS_CACHE_KEY);
      if (cachedMeals) {
        setRecentMeals(cachedMeals);
      }
    }
  }, [user, cache]);

  const addMeal = useCallback(async (meal) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/nutrition/meals', {
        ...meal,
        userId: user.id
      });

      if (response.data) {
        setRecentMeals(prev => [response.data, ...prev]);
        await updateDailyNutrition();
      }
    } catch (err) {
      setError(err.message || 'Failed to add meal');
    } finally {
      setLoading(false);
    }
  }, [user, updateDailyNutrition]);

  const removeMeal = useCallback(async (mealId) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await api.delete(`/nutrition/meals/${mealId}`);
      setRecentMeals(prev => prev.filter(meal => meal.id !== mealId));
      await updateDailyNutrition();
    } catch (err) {
      setError(err.message || 'Failed to remove meal');
    } finally {
      setLoading(false);
    }
  }, [user, updateDailyNutrition]);

  const updateMeal = useCallback(async (mealId, updates) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.patch(`/nutrition/meals/${mealId}`, updates);
      if (response.data) {
        setRecentMeals(prev => 
          prev.map(meal => meal.id === mealId ? { ...meal, ...response.data } : meal)
        );
        await updateDailyNutrition();
      }
    } catch (err) {
      setError(err.message || 'Failed to update meal');
    } finally {
      setLoading(false);
    }
  }, [user, updateDailyNutrition]);

  const refreshData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchDailyNutrition(),
        fetchRecentMeals()
      ]);
    } catch (err) {
      setError(err.message || 'Failed to refresh nutrition data');
    } finally {
      setLoading(false);
    }
  }, [user, fetchDailyNutrition, fetchRecentMeals]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    dailyNutrition,
    recentMeals,
    loading,
    error,
    addMeal,
    removeMeal,
    updateMeal,
    refreshData
  };
};

export default useNutritionData;

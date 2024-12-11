import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useCacheStore } from '../stores/cacheStore';
import { api } from '../services/api';
import { DailyNutrition, Meal } from '../types/store';

interface NutritionData {
  dailyNutrition: DailyNutrition | null;
  recentMeals: Meal[];
  loading: boolean;
  error: string | null;
  addMeal: (meal: Omit<Meal, 'id'>) => Promise<void>;
  removeMeal: (mealId: string) => Promise<void>;
  updateMeal: (mealId: string, updates: Partial<Meal>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const MEALS_CACHE_KEY = 'recentMeals';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useNutritionData = (): NutritionData => {
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { dailyNutrition, fetchDailyNutrition, updateDailyNutrition } = useNutritionStore();
  const cache = useCacheStore();

  const fetchRecentMeals = useCallback(async () => {
    if (!user) return;

    try {
      // Check cache first
      const cachedMeals = cache.get<Meal[]>(MEALS_CACHE_KEY);
      if (cachedMeals) {
        setRecentMeals(cachedMeals);
        return;
      }

      const response = await api.get('/meals/recent', {
        params: { userId: user.id },
      });

      const meals = response.data;
      setRecentMeals(meals);
      cache.set(MEALS_CACHE_KEY, meals, CACHE_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent meals');
    }
  }, [user, cache]);

  const addMeal = useCallback(async (meal: Omit<Meal, 'id'>) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/meals', {
        ...meal,
        userId: user.id,
      });

      const newMeal = response.data;
      setRecentMeals(prev => [newMeal, ...prev]);

      // Update daily nutrition
      if (dailyNutrition) {
        await updateDailyNutrition(new Date(), {
          ...dailyNutrition,
          calories: dailyNutrition.calories + meal.calories,
          protein: dailyNutrition.protein + meal.protein,
          carbs: dailyNutrition.carbs + meal.carbs,
          fat: dailyNutrition.fat + meal.fat,
          meals: [...dailyNutrition.meals, newMeal],
        });
      }

      // Update cache
      const cachedMeals = cache.get<Meal[]>(MEALS_CACHE_KEY) || [];
      cache.set(MEALS_CACHE_KEY, [newMeal, ...cachedMeals], CACHE_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal');
    } finally {
      setLoading(false);
    }
  }, [user, dailyNutrition, updateDailyNutrition, cache]);

  const removeMeal = useCallback(async (mealId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await api.delete(`/meals/${mealId}`);
      setRecentMeals(prev => prev.filter(meal => meal.id !== mealId));

      // Update daily nutrition
      if (dailyNutrition) {
        const removedMeal = dailyNutrition.meals.find(meal => meal.id === mealId);
        if (removedMeal) {
          await updateDailyNutrition(new Date(), {
            ...dailyNutrition,
            calories: dailyNutrition.calories - removedMeal.calories,
            protein: dailyNutrition.protein - removedMeal.protein,
            carbs: dailyNutrition.carbs - removedMeal.carbs,
            fat: dailyNutrition.fat - removedMeal.fat,
            meals: dailyNutrition.meals.filter(meal => meal.id !== mealId),
          });
        }
      }

      // Update cache
      const cachedMeals = cache.get<Meal[]>(MEALS_CACHE_KEY) || [];
      cache.set(
        MEALS_CACHE_KEY,
        cachedMeals.filter(meal => meal.id !== mealId),
        CACHE_DURATION
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove meal');
    } finally {
      setLoading(false);
    }
  }, [user, dailyNutrition, updateDailyNutrition, cache]);

  const updateMeal = useCallback(async (mealId: string, updates: Partial<Meal>) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/meals/${mealId}`, updates);
      const updatedMeal = response.data;

      setRecentMeals(prev =>
        prev.map(meal => (meal.id === mealId ? updatedMeal : meal))
      );

      // Update daily nutrition
      if (dailyNutrition) {
        const oldMeal = dailyNutrition.meals.find(meal => meal.id === mealId);
        if (oldMeal) {
          await updateDailyNutrition(new Date(), {
            ...dailyNutrition,
            calories: dailyNutrition.calories - oldMeal.calories + updatedMeal.calories,
            protein: dailyNutrition.protein - oldMeal.protein + updatedMeal.protein,
            carbs: dailyNutrition.carbs - oldMeal.carbs + updatedMeal.carbs,
            fat: dailyNutrition.fat - oldMeal.fat + updatedMeal.fat,
            meals: dailyNutrition.meals.map(meal =>
              meal.id === mealId ? updatedMeal : meal
            ),
          });
        }
      }

      // Update cache
      const cachedMeals = cache.get<Meal[]>(MEALS_CACHE_KEY) || [];
      cache.set(
        MEALS_CACHE_KEY,
        cachedMeals.map(meal => (meal.id === mealId ? updatedMeal : meal)),
        CACHE_DURATION
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meal');
    } finally {
      setLoading(false);
    }
  }, [user, dailyNutrition, updateDailyNutrition, cache]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchDailyNutrition(new Date(), true),
        fetchRecentMeals(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchDailyNutrition, fetchRecentMeals]);

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
    refreshData,
  };
};

export default useNutritionData;

import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCacheStore } from '../stores/cacheStore';
import { api } from '../services/api';
import { ExercisesHook, Exercise } from '../types/hooks';

const CACHE_KEY = 'exercises';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useExercises = (): ExercisesHook => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const cache = useCacheStore();

  const fetchExercises = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = cache.get<Exercise[]>(CACHE_KEY);
      if (cachedData) {
        setExercises(cachedData);
        return;
      }

      const response = await api.get('/exercises', {
        params: { userId: user.id },
      });

      const exerciseData = response.data;
      setExercises(exerciseData);
      cache.set(CACHE_KEY, exerciseData, CACHE_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  }, [user, cache]);

  const addExercise = useCallback(async (exercise: Omit<Exercise, 'id'>) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/exercises', {
        ...exercise,
        userId: user.id,
      });

      const newExercise = response.data;
      setExercises(prev => [...prev, newExercise]);
      
      // Update cache
      const cachedExercises = cache.get<Exercise[]>(CACHE_KEY) || [];
      cache.set(CACHE_KEY, [...cachedExercises, newExercise], CACHE_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exercise');
    } finally {
      setLoading(false);
    }
  }, [user, cache]);

  const deleteExercise = useCallback(async (id: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await api.delete(`/exercises/${id}`);
      setExercises(prev => prev.filter(exercise => exercise.id !== id));
      
      // Update cache
      const cachedExercises = cache.get<Exercise[]>(CACHE_KEY) || [];
      cache.set(
        CACHE_KEY,
        cachedExercises.filter(exercise => exercise.id !== id),
        CACHE_DURATION
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise');
    } finally {
      setLoading(false);
    }
  }, [user, cache]);

  return {
    exercises,
    addExercise,
    deleteExercise,
    loading,
    error,
  };
};

export default useExercises;

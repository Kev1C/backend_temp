import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCacheStore } from '../stores/cacheStore';
import { api } from '../services/api';
import { MacroTrackerHook } from '../types/hooks';

const CACHE_KEY = 'macroTracker';

export const useMacroTracker = (): MacroTrackerHook => {
  const [macros, setMacros] = useState<MacroTrackerHook['macros']>({
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const cache = useCacheStore();

  const addMacros = useCallback(async (protein: number, carbs: number, fat: number) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const newMacros = {
        protein: macros.protein + protein,
        carbs: macros.carbs + carbs,
        fat: macros.fat + fat,
      };

      setMacros(newMacros);

      const response = await api.post('/nutrition/macros', {
        userId: user.id,
        macros: { protein, carbs, fat },
      });

      cache.set(CACHE_KEY, newMacros);

      if (!response.data.success) {
        throw new Error('Failed to update macros');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update macros');
      // Rollback on error
      setMacros(macros);
    } finally {
      setLoading(false);
    }
  }, [macros, user, cache]);

  const resetMacros = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await api.post('/nutrition/macros/reset', {
        userId: user.id,
      });

      const resetMacros = { protein: 0, carbs: 0, fat: 0 };
      setMacros(resetMacros);
      cache.set(CACHE_KEY, resetMacros);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset macros');
    } finally {
      setLoading(false);
    }
  }, [user, cache]);

  return {
    macros,
    addMacros,
    resetMacros,
    loading,
    error,
  };
};

export default useMacroTracker;

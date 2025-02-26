// frontend/hooks/useDailyNutrition.js
import { useState, useCallback, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useErrorHandler } from './useErrorHandler';
import { AuthContext } from '../context/AuthContext';
import isEqual from 'lodash/isEqual';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useDailyNutrition = (initialDate) => {
  const { user } = useContext(AuthContext);
  const [dailyNutrition, setDailyNutrition] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleError = useErrorHandler();
  const cache = useRef(new Map());
  const lastFetch = useRef(new Map());
  const prevDailyNutrition = useRef(null);

  const formatDate = useCallback((date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const getCacheKey = useCallback((date) => {
    const userId = user?.userId || user?.id || user?._id || 'default';
    return `${userId}_${formatDate(date)}`;
  }, [user, formatDate]);

  const shouldFetch = useCallback((cacheKey) => {
    const lastFetchTime = lastFetch.current.get(cacheKey);
    return !lastFetchTime || Date.now() - lastFetchTime > CACHE_DURATION;
  }, []);

  const fetchDailyNutrition = useCallback(async (date, force = false) => {
    const userId = user?.userId || user?.id || user?._id;
    if (!userId) {
      return;
    }

    const formattedDate = formatDate(date);
    const cacheKey = getCacheKey(date);

    // If forced, clear both local and persisted cache.
    if (force) {
      cache.current.delete(cacheKey);
      lastFetch.current.delete(cacheKey);
      await AsyncStorage.removeItem(cacheKey);
    }

    // First, check persisted AsyncStorage cache if available.
    if (!force) {
      try {
        const persisted = await AsyncStorage.getItem(cacheKey);
        if (persisted) {
          const parsed = JSON.parse(persisted); // expected: { data, timestamp }
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            setDailyNutrition(parsed.data);
            prevDailyNutrition.current = parsed.data;
            return;
          }
        }
      } catch (err) {
        console.error('Error reading persisted daily nutrition:', err);
      }
    }

    // Next, attempt in‑memory cache.
    if (!force && !shouldFetch(cacheKey)) {
      const cachedData = cache.current.get(cacheKey);
      if (cachedData && isEqual(cachedData, prevDailyNutrition.current)) {
        return;
      } else if (cachedData) {
        setDailyNutrition(cachedData);
        prevDailyNutrition.current = cachedData;
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.get(`/nutrition/daily/${formattedDate}`);
      const newDailyNutrition = response.data || { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] };

      // Update in‑memory caches.
      cache.current.set(cacheKey, newDailyNutrition);
      lastFetch.current.set(cacheKey, Date.now());

      // Persist to AsyncStorage along with a timestamp.
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ data: newDailyNutrition, timestamp: Date.now() })
      );

      if (!isEqual(newDailyNutrition, prevDailyNutrition.current)) {
        setDailyNutrition(newDailyNutrition);
        prevDailyNutrition.current = newDailyNutrition;
      }
    } catch (error) {
      handleError(error.message || 'Failed to fetch nutrition data');
      if (dailyNutrition === null) {
        const defaultData = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] };
        setDailyNutrition(defaultData);
        prevDailyNutrition.current = defaultData;
      }
    } finally {
      setLoading(false);
    }
  }, [user, formatDate, getCacheKey, shouldFetch, handleError, dailyNutrition]);

  const clearCache = useCallback(() => {
    cache.current.clear();
    lastFetch.current.clear();
  }, []);

  return {
    dailyNutrition,
    loading,
    fetchDailyNutrition,
    setDailyNutrition,
    isLoading: loading,
    formatDate,
    clearCache
  };
};

export default useDailyNutrition;

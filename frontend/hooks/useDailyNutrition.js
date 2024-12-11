// frontend/hooks/useDailyNutrition.js
import { useState, useCallback, useContext, useRef } from 'react';
import { api, cachedGet } from '../services/api';
import { useErrorHandler } from './useErrorHandler';
import { AuthContext } from '../context/AuthContext';
import isEqual from 'lodash/isEqual';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useDailyNutrition = () => {
  const { user } = useContext(AuthContext);
  const [dailyNutrition, setDailyNutrition] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleError = useErrorHandler();
  const cache = useRef(new Map());
  const lastFetch = useRef(new Map());

  const formatDate = useCallback((date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const getCacheKey = useCallback((date) => {
    // Use a default ID if user object is not available
    const userId = user?.userId || user?.id || user?._id || 'default';
    console.log('Getting cache key with userId:', userId);
    return `${userId}_${formatDate(date)}`;
  }, [user, formatDate]);

  const shouldFetch = useCallback((cacheKey) => {
    const lastFetchTime = lastFetch.current.get(cacheKey);
    return !lastFetchTime || Date.now() - lastFetchTime > CACHE_DURATION;
  }, []);

  const fetchDailyNutrition = useCallback(async (date, force = false) => {
    // Get user ID from any available field
    const userId = user?.userId || user?.id || user?._id;

    // Prevent unnecessary API calls if no user ID or dailyNutrition is already null
    if (!userId) {
      console.log('No user ID available. User object:', user);
      return;
    }

    if (dailyNutrition === null && !force) {
      console.log('dailyNutrition is already null, skipping fetch');
      return;
    }

    const formattedDate = formatDate(date);
    console.log(`Fetching nutrition for date: ${formattedDate}, userId: ${userId}`);

    const cacheKey = getCacheKey(date);

    // Always fetch if force is true or after adding a meal
    if (force) {
      console.log('Force refresh requested, clearing cache');
      cache.current.delete(cacheKey);
      lastFetch.current.delete(cacheKey);
    }

    // Return cached data if available and not forced refresh
    if (!force && !shouldFetch(cacheKey)) {
      const cachedData = cache.current.get(cacheKey);
      // Check if cached data is the same as current state before updating
      if (cachedData && isEqual(cachedData, dailyNutrition)) {
        console.log('Using cached nutrition (no change)');
        return;
      } else if (cachedData) {
        console.log('Using cached nutrition ', cachedData);
        setDailyNutrition(cachedData);
        return;
      }
    }

    setLoading(true);
    try {
      console.log('Making API request for nutrition data...');
      const response = await api.get(`/nutrition/daily/${formattedDate}`);
      console.log('Received nutrition ', response.data);

      // Update dailyNutrition even if the response is empty
      const newDailyNutrition = response.data || { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] };

      // Update local cache
      cache.current.set(cacheKey, newDailyNutrition);
      lastFetch.current.set(cacheKey, Date.now());

      setDailyNutrition(newDailyNutrition);
    } catch (error) {
      console.error('Error fetching nutrition:', error);
      handleError(error.message || 'Failed to fetch nutrition data');
      setDailyNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] });
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

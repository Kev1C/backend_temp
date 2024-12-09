import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import debounce from 'lodash.debounce';
import * as SecureStore from 'expo-secure-store';
import { api, cachedGet } from '../services/api';
import { useErrorHandler } from './useErrorHandler';
import { AuthContext } from '../context/AuthContext';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const EXERCISES_PER_PAGE = 20;

const useExercises = (searchQuery = '', filters = {}) => {
  const { user } = useContext(AuthContext);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const handleError = useErrorHandler();
  const abortController = useRef(null);
  const lastFetch = useRef(null);

  const getCacheKey = useCallback((query, appliedFilters, pageNum) => {
    return `exercises_${user?.id}_${query}_${JSON.stringify(appliedFilters)}_${pageNum}`;
  }, [user?.id]);

  const shouldFetch = useCallback((timestamp) => {
    return !timestamp || Date.now() - timestamp > CACHE_DURATION;
  }, []);

  const fetchExercises = useCallback(async (query = '', appliedFilters = {}, pageNum = 1, force = false) => {
    if (!user?.id) {
      handleError('Please log in to fetch exercises.', 'Authentication Error');
      setLoading(false);
      return;
    }

    // Cancel previous request if it exists
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      const cacheKey = getCacheKey(query, appliedFilters, pageNum);
      
      // Check cache first
      if (!force) {
        const cachedData = await SecureStore.getItemAsync(cacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (!shouldFetch(timestamp)) {
            setExercises(prev => pageNum === 1 ? data : [...prev, ...data]);
            setHasMore(data.length === EXERCISES_PER_PAGE);
            setPage(prev => prev + 1);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        }
      }

      const response = await cachedGet('/exercises', {
        params: {
          search: query,
          muscles: appliedFilters.muscles?.join(',') || '',
          equipment: appliedFilters.equipment?.join(',') || '',
          difficulty: appliedFilters.difficulty || '',
          page: pageNum,
          limit: EXERCISES_PER_PAGE,
        },
        signal: abortController.current.signal,
        cacheKey: `api_${cacheKey}`,
        cacheTime: CACHE_DURATION
      });

      const fetchedExercises = response.data;
      
      // Update state
      setExercises(prev => pageNum === 1 ? fetchedExercises : [...prev, ...fetchedExercises]);
      setHasMore(fetchedExercises.length === EXERCISES_PER_PAGE);
      setPage(prev => prev + 1);

      // Cache the results
      await SecureStore.setItemAsync(cacheKey, JSON.stringify({
        data: fetchedExercises,
        timestamp: Date.now()
      }));

      lastFetch.current = Date.now();
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled, ignore error
      }
      handleError(error.message || 'Failed to fetch exercises.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      abortController.current = null;
    }
  }, [user?.id, getCacheKey, shouldFetch, handleError]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Debounced search
  const debouncedFetch = useCallback(
    debounce((query, filters) => fetchExercises(query, filters, 1), 300),
    [fetchExercises]
  );

  // Handle search and filter changes
  useEffect(() => {
    if (user?.id) {
      debouncedFetch(searchQuery, filters);
    }
    return () => debouncedFetch.cancel();
  }, [user?.id, searchQuery, filters, debouncedFetch]);

  const refreshExercises = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchExercises(searchQuery, filters, 1, true);
  }, [searchQuery, filters, fetchExercises]);

  const loadMoreExercises = useCallback(() => {
    if (!loading && !refreshing && hasMore) {
      fetchExercises(searchQuery, filters, page);
    }
  }, [loading, refreshing, hasMore, searchQuery, filters, page, fetchExercises]);

  return {
    exercises,
    loading,
    refreshing,
    hasMore,
    refreshExercises,
    loadMoreExercises
  };
};

export default useExercises;
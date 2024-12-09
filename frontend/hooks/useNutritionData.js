import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api, cachedGet } from '../services/api';
import moment from 'moment';

const useNutritionData = () => {
  const { authToken, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [macroData, setMacroData] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Cache time window in milliseconds (5 minutes)
  const CACHE_WINDOW = 5 * 60 * 1000;

  // Memoize date ranges
  const dateRanges = useMemo(() => {
    const now = moment();
    return {
      macros: Array.from({ length: 7 }, (_, i) => 
        now.clone().subtract(i, 'days').format('YYYY-MM-DD')
      ),
      calendar: Array.from({ length: 30 }, (_, i) => 
        now.clone().subtract(i, 'days').format('YYYY-MM-DD')
      )
    };
  }, []);

  const fetchNutritionData = useCallback(async (force = false) => {
    if (!authToken || (!force && lastFetch && Date.now() - lastFetch < CACHE_WINDOW)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Batch fetch data with optimized caching
      const [macroResponses, calendarResponses] = await Promise.all([
        Promise.all(
          dateRanges.macros.map(date => 
            cachedGet(`/nutrition/daily/${date}`, {
              cacheKey: `nutrition-${date}-${user?.id}`,
              cacheTime: CACHE_WINDOW
            })
          )
        ),
        Promise.all(
          dateRanges.calendar.map(date => 
            cachedGet(`/nutrition/daily/${date}`, {
              cacheKey: `nutrition-${date}-${user?.id}`,
              cacheTime: CACHE_WINDOW
            })
          )
        )
      ]);
      
      // Process macro data
      const formattedMacroData = {
        labels: dateRanges.macros.map(date => moment(date).format('MMM D')),
        datasets: [
          {
            data: macroResponses.map(response => response.data.protein || 0),
            color: '#4285F4',
            strokeWidth: 2,
            name: 'Protein'
          },
          {
            data: macroResponses.map(response => response.data.carbs || 0),
            color: '#34A853',
            strokeWidth: 2,
            name: 'Carbs'
          },
          {
            data: macroResponses.map(response => response.data.fat || 0),
            color: '#FBBC04',
            strokeWidth: 2,
            name: 'Fat'
          }
        ],
        legend: ['Protein', 'Carbs', 'Fat']
      };
      
      // Process calendar data
      const formattedCalendarData = calendarResponses.reduce((acc, response, i) => {
        const calories = response.data.calories || 0;
        if (calories > 0) {
          acc[dateRanges.calendar[i]] = { value: calories };
        }
        return acc;
      }, {});

      setMacroData(formattedMacroData);
      setCalendarData(formattedCalendarData);
      setLastFetch(Date.now());

    } catch (err) {
      console.error('Error fetching nutrition data:', err);
      setError(err.message || 'Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  }, [authToken, user?.id, dateRanges]);

  // Fetch data on mount and when auth changes
  useEffect(() => {
    fetchNutritionData();
  }, [fetchNutritionData]);

  return { 
    macroData, 
    calendarData, 
    loading, 
    error, 
    refreshData: () => fetchNutritionData(true) 
  };
};

export default useNutritionData;

import { useState, useEffect, useContext, useCallback } from 'react';
import { Alert } from 'react-native';
import { INITIAL_CALORIES, CALORIE_GOAL } from './constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';

const CALORIES_STORAGE_KEY = '@calories';
const LAST_RESET_DATE_KEY = '@last_reset_date';
const FIRST_LOAD_KEY = '@first_load';

const useCalorieTracker = (initial = INITIAL_CALORIES, goal = CALORIE_GOAL) => {
  const { user } = useContext(AuthContext);
  const [calories, setCalories] = useState(initial);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user-specific storage keys
  const getUserKeys = useCallback(() => ({
    calories: `${CALORIES_STORAGE_KEY}_${user?.id}`,
    lastReset: `${LAST_RESET_DATE_KEY}_${user?.id}`,
    firstLoad: `${FIRST_LOAD_KEY}_${user?.id}`
  }), [user?.id]);

  // Memoized storage operations
  const storage = {
    getItem: useCallback(async (key) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.warn(`Error reading ${key}:`, error);
        return null;
      }
    }, []),
    
    setItem: useCallback(async (key, value) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.warn(`Error writing ${key}:`, error);
      }
    }, []),
    
    multiRemove: useCallback(async (keys) => {
      try {
        await AsyncStorage.multiRemove(keys);
      } catch (error) {
        console.warn('Error removing items:', error);
      }
    }, [])
  };

  // Load saved calories and check if we need to reset
  useEffect(() => {
    const loadCalories = async () => {
      if (!user?.id || isInitialized) return;

      try {
        const keys = getUserKeys();
        const isFirstLoad = await storage.getItem(keys.firstLoad);
        
        if (!isFirstLoad) {
          await storage.multiRemove([keys.calories, keys.lastReset]);
          await storage.setItem(keys.firstLoad, 'false');
          setCalories(0);
          setIsInitialized(true);
          return;
        }

        const [savedCalories, lastResetDate] = await Promise.all([
          storage.getItem(keys.calories),
          storage.getItem(keys.lastReset)
        ]);

        const today = new Date().toDateString();

        if (lastResetDate !== today) {
          setCalories(0);
          await Promise.all([
            storage.setItem(keys.calories, '0'),
            storage.setItem(keys.lastReset, today)
          ]);
        } else if (savedCalories !== null) {
          setCalories(parseInt(savedCalories, 10));
        } else {
          setCalories(0);
          await storage.setItem(keys.calories, '0');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading calories:', error);
        setCalories(0);
        setIsInitialized(true);
      }
    };

    loadCalories();
  }, [user?.id, isInitialized, getUserKeys, storage]);

  const addCalories = useCallback(async (amount = 100) => {
    if (!user?.id) return;
    
    try {
      const newCalories = Math.min(calories + amount, goal);
      setCalories(newCalories);
      await storage.setItem(getUserKeys().calories, newCalories.toString());
      
      if (newCalories >= goal) {
        Alert.alert('Congratulations!', 'You have reached your daily calorie goal!');
      }
    } catch (error) {
      console.error('Error saving calories:', error);
    }
  }, [calories, goal, user?.id, getUserKeys, storage]);

  const resetCalories = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const keys = getUserKeys();
      setCalories(0);
      const today = new Date().toDateString();
      await Promise.all([
        storage.setItem(keys.calories, '0'),
        storage.setItem(keys.lastReset, today)
      ]);
    } catch (error) {
      console.error('Error resetting calories:', error);
    }
  }, [user?.id, getUserKeys, storage]);

  return { 
    calories, 
    goal, 
    addCalories, 
    resetCalories,
    isInitialized 
  };
};

export default useCalorieTracker;
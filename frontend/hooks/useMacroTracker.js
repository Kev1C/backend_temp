import { useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import useNutrientCalculations from './useNutrientCalculations';

const MACROS_STORAGE_KEY = '@macros';
const LAST_RESET_DATE_KEY = '@macros_last_reset';

const useMacroTracker = () => {
  const { user } = useContext(AuthContext);
  const goals = useNutrientCalculations();
  const [macros, setMacros] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user-specific storage keys
  const getStorageKeys = useCallback(() => ({
    macros: `${MACROS_STORAGE_KEY}_${user?.id}`,
    lastReset: `${LAST_RESET_DATE_KEY}_${user?.id}`
  }), [user?.id]);

  // Load saved macros and check for daily reset
  useEffect(() => {
    const loadMacros = async () => {
      if (!user?.id || isInitialized) return;

      try {
        const keys = getStorageKeys();
        const [savedMacros, lastResetDate] = await Promise.all([
          AsyncStorage.getItem(keys.macros),
          AsyncStorage.getItem(keys.lastReset)
        ]);

        const today = new Date().toDateString();

        if (lastResetDate !== today) {
          // New day, reset macros
          setMacros({ protein: 0, carbs: 0, fat: 0 });
          await Promise.all([
            AsyncStorage.setItem(keys.macros, JSON.stringify({ protein: 0, carbs: 0, fat: 0 })),
            AsyncStorage.setItem(keys.lastReset, today)
          ]);
        } else if (savedMacros) {
          // Same day, load saved macros
          setMacros(JSON.parse(savedMacros));
        }
      } catch (error) {
        console.error('Error loading macros:', error);
        setMacros({ protein: 0, carbs: 0, fat: 0 });
      } finally {
        setIsInitialized(true);
      }
    };

    loadMacros();
  }, [user?.id, isInitialized, getStorageKeys]);

  const addMacros = useCallback(async (newProtein = 0, newCarbs = 0, newFat = 0) => {
    if (!user?.id) return;

    try {
      const updatedMacros = {
        protein: Math.min(Math.max(0, macros.protein + newProtein), goals.protein),
        carbs: Math.min(Math.max(0, macros.carbs + newCarbs), goals.carbs),
        fat: Math.min(Math.max(0, macros.fat + newFat), goals.fat)
      };

      setMacros(updatedMacros);
      await AsyncStorage.setItem(getStorageKeys().macros, JSON.stringify(updatedMacros));
    } catch (error) {
      console.error('Error saving macros:', error);
    }
  }, [user?.id, macros, goals, getStorageKeys]);

  const resetMacros = useCallback(async () => {
    if (!user?.id) return;

    try {
      const resetState = { protein: 0, carbs: 0, fat: 0 };
      const keys = getStorageKeys();
      const today = new Date().toDateString();

      setMacros(resetState);
      await Promise.all([
        AsyncStorage.setItem(keys.macros, JSON.stringify(resetState)),
        AsyncStorage.setItem(keys.lastReset, today)
      ]);
    } catch (error) {
      console.error('Error resetting macros:', error);
    }
  }, [user?.id, getStorageKeys]);

  return {
    macros,
    addMacros,
    resetMacros,
    goals,
    isInitialized
  };
};

export default useMacroTracker;

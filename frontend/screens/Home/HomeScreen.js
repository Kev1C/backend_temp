// frontend/screens/Home/HomeScreen.js
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, View, Image, FlatList, StyleSheet, Alert } from 'react-native';
import { useTheme, FAB } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { useNutritionStore, formatDate } from '../../stores/nutritionStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useCalorieStore } from '../../hooks/useCalorieTracker';
import useMacroStore from '../../hooks/useMacroTracker';
import useNutrientCalculations from '../../hooks/useNutrientCalculations';
import { MemoizedWeekCalendar, MemoizedCalorieProgress, MemoizedRecentlyEaten } from './MemoizedComponents';
import NativeAdComponent from '../../Components/NativeAdComponent';
import { api } from '../../services/api';
import isEqual from 'lodash/isEqual';
import createStyles from './HomeScreenStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const { user, authToken, isGuest } = useAuthStore();
  const { onboardingData, isOnboardingComplete } = useOnboardingStore();
  const { calculatedNutrients, loading: loadingNutrients, fetchCalculations } = useNutrientCalculations();
  const { fetchDailyNutrition, dailyNutrition, isLoading: isLoadingNutrition, updateDailyNutrition } = useNutritionStore();
  const { calories, addCalories, resetCalories } = useCalorieStore();
  const macroStore = useMacroStore();
  const { macros, addMacros, resetMacros, checkDailyReset, hydrated } = macroStore;
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  // Add loading state indicators
  const [loadingStates, setLoadingStates] = useState({
    meals: false,
    nutrition: false,
    saving: false
  });

  // State for recently eaten meals
  const [recentMeals, setRecentMeals] = useState([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch nutrient calculations when user and onboarding data are available
  useEffect(() => {
    const initializeNutrients = async () => {
      if (user && onboardingData && isOnboardingComplete) {
        const userData = {
          ...onboardingData,
          fitnessGoal: onboardingData.goal || onboardingData.fitnessGoal
        };
        try {
          await fetchCalculations(userData);
          // Reset macros after calculating nutrients
          resetMacros();
        } catch (error) {
          console.error('Error initializing nutrients:', error);
        }
      }
    };
    
    initializeNutrients();
  }, [user, onboardingData, isOnboardingComplete, fetchCalculations, resetMacros]);

  // Optimize date selection handler
  const handleDateSelect = useCallback(async (date) => {
    if (!date) return;
    
    const newFormattedDate = formatDate(date);
    const currentFormattedDate = selectedDate ? formatDate(selectedDate) : null;
    
    // If the selected date is the same as current and we have data, no need to fetch
    if (currentFormattedDate === newFormattedDate && dailyNutrition) {
      return;
    }
    
    setSelectedDate(date);
    await fetchDailyNutrition(date);
  }, [selectedDate, dailyNutrition, fetchDailyNutrition]);

  // Initialize selected date and load initial data only once
  useEffect(() => {
    if (!isInitialized) {
      const initializeData = async () => {
        console.log('Initial data load for date:', selectedDate);
        await handleDateSelect(selectedDate);
        setIsInitialized(true);
      };
      
      initializeData();
    }
  }, [isInitialized, handleDateSelect, selectedDate]);

  // Memoize fetchRecentMeals to prevent recreation on every render
  const fetchRecentMeals = useCallback(async (date) => {
    try {
      setLoadingStates(prev => ({ ...prev, meals: true }));
      const formattedDate = formatDate(date);

      if (isGuest) {
        const storedMeals = await AsyncStorage.getItem(`guest-meals-${formattedDate}`);
        setRecentMeals(storedMeals ? JSON.parse(storedMeals) : []);
        return;
      }

      const response = await api.get('/meals/recent', { 
        params: { date: formattedDate },
      });
      setRecentMeals(response.data);
    } catch (error) {
      console.error('Error fetching recent meals:', error);
      setRecentMeals([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, meals: false }));
    }
  }, [isGuest, formatDate]);

  // Check for daily macro reset
  useEffect(() => {
    if (hydrated) {
      checkDailyReset();
    }
  }, [hydrated, checkDailyReset]);

  // Add function to save guest meal data
  const saveGuestMealData = useCallback(async (meal, date) => {
    try {
      setLoadingStates(prev => ({ ...prev, saving: true }));
      const formattedDate = formatDate(date);
      const storedMeals = await AsyncStorage.getItem(`guest-meals-${formattedDate}`);
      const currentMeals = storedMeals ? JSON.parse(storedMeals) : [];
      const updatedMeals = [...currentMeals, meal];
      await AsyncStorage.setItem(`guest-meals-${formattedDate}`, JSON.stringify(updatedMeals));
      setRecentMeals(updatedMeals);
    } catch (error) {
      console.error('Error saving guest meal:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, saving: false }));
    }
  }, [formatDate]);

  // Save meal to backend
  const saveMealToBackend = async (meal, date) => {
    try {
      setLoadingStates(prev => ({ ...prev, saving: true }));
      const formattedDate = formatDate(date);
      
      if (isGuest) {
        await saveGuestMealData(meal, date);
      } else {
        await api.post('/meals', { 
          ...meal,
          date: formattedDate
        });
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, saving: false }));
    }
  };

  // Handle navigation params when returning from camera
  useEffect(() => {
    const params = route.params;
    if (params?.addMeal) {
      const newMeal = params.addMeal;
      
      // Save meal and update nutrition
      (async () => {
        try {
          setLoadingStates(prev => ({ ...prev, saving: true }));
          
          // Update nutrition store with new meal
          await updateDailyNutrition(selectedDate, newMeal);
          
          // Save to backend without triggering another fetch
          await saveMealToBackend(newMeal, selectedDate);
          
          // Force a refresh of daily nutrition data
          await fetchDailyNutrition(selectedDate, true);
          
        } catch (error) {
          console.error('Error handling camera return:', error);
          Alert.alert('Error', 'Failed to update nutrition data');
        } finally {
          setLoadingStates(prev => ({ ...prev, saving: false }));
        }
      })();
    }
  }, [route.params, selectedDate, saveMealToBackend, updateDailyNutrition, fetchDailyNutrition]);

  // Add effect to handle nutrition updates
  useEffect(() => {
    if (dailyNutrition && selectedDate) {
      const formattedDate = formatDate(selectedDate);
      const nutritionDate = formatDate(new Date(dailyNutrition.date));
      
      if (formattedDate === nutritionDate) {
        console.log('Updating UI with new nutrition data');
        // Reset and update macros
        resetMacros();
        addMacros(
          dailyNutrition.protein || 0,
          dailyNutrition.carbs || 0,
          dailyNutrition.fats || 0
        );
        if (addCalories) {
          addCalories(dailyNutrition.calories || 0);
        }
        
        // Update meals
        setMeals(dailyNutrition.meals || []);
      }
    }
  }, [dailyNutrition, selectedDate, resetMacros, addMacros, addCalories]);

  // Memoize nutrients data for display
  const nutrients = useMemo(() => {
    if (!dailyNutrition) {
      return {
        current: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        goals: calculatedNutrients || { calories: 0, protein: 0, carbs: 0, fats: 0 },
        loading: isLoadingNutrition
      };
    }

    return {
      current: {
        calories: Number(dailyNutrition.calories || 0),
        protein: Number(dailyNutrition.protein || 0),
        carbs: Number(dailyNutrition.carbs || 0),
        fats: Number(dailyNutrition.fats || 0)
      },
      goals: calculatedNutrients || { calories: 0, protein: 0, carbs: 0, fats: 0 },
      loading: isLoadingNutrition
    };
  }, [dailyNutrition, calculatedNutrients, isLoadingNutrition]);

  // Memoize meals data to prevent unnecessary re-renders
  const mealsData = useMemo(() => ({
    meals: dailyNutrition?.meals || [],
    isLoading: isLoadingNutrition || loadingStates.saving
  }), [dailyNutrition?.meals, isLoadingNutrition, loadingStates.saving]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <MemoizedWeekCalendar 
          onDateSelect={handleDateSelect} 
          selectedDate={selectedDate} 
        />
        <MemoizedCalorieProgress nutrients={nutrients} />
      </View>
      <View style={[styles.mealsContainer, { paddingBottom: insets.bottom }]}>
        <Text style={styles.sectionTitle}>Recently Eaten</Text>
        <NativeAdComponent />
        <MemoizedRecentlyEaten {...mealsData} />
      </View>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate('Camera')}
      />
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mealsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
    color: theme.colors.onSurface,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen;
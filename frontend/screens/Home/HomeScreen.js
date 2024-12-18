// frontend/screens/Home/HomeScreen.js
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, SafeAreaView, View, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTheme, FAB } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { useNutritionStore, formatDate } from '../../stores/nutritionStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useCalorieStore } from '../../hooks/useCalorieTracker';
import useMacroStore from '../../hooks/useMacroTracker';
import useNutrientCalculations from '../../hooks/useNutrientCalculations';
import { MemoizedWeekCalendar, MemoizedCalorieProgress, MemoizedRecentlyEaten } from './MemoizedComponents';
import { api } from '../../services/api';
import isEqual from 'lodash/isEqual';
import createStyles from './HomeScreenStyles';

const HomeScreen = () => {
  const { user, authToken, isGuest } = useAuthStore();
  const { onboardingData, isOnboardingComplete } = useOnboardingStore();
  const { calculatedNutrients, loading: loadingNutrients, fetchCalculations } = useNutrientCalculations();
  const { fetchDailyNutrition, dailyNutrition, isLoading: isLoadingNutrition } = useNutritionStore();
  const { calories, addCalories, resetCalories } = useCalorieStore();
  const macroStore = useMacroStore();
  const { macros, addMacros, resetMacros, checkDailyReset, hydrated } = macroStore;
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  const [prevAddMeal, setPrevAddMeal] = useState(null);
  const [prevUpdateProgress, setPrevUpdateProgress] = useState(null);
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

  // Memoize date selection handler
  const handleDateSelect = useCallback(async (date) => {
    if (!date) return;
    
    const newFormattedDate = formatDate(date);
    const currentFormattedDate = selectedDate ? formatDate(selectedDate) : null;
    
    // If the selected date is the same as current and we have data, no need to fetch
    if (currentFormattedDate === newFormattedDate && dailyNutrition) {
      console.log('Using existing data for:', newFormattedDate);
      return;
    }
    
    console.log('Selecting new date:', newFormattedDate);
    setSelectedDate(date);

    try {
      // Check if we have data in the store first
      const store = useNutritionStore.getState();
      const hasData = store.dailyNutrition && store.currentDate === newFormattedDate;
      let nutritionData;
      
      if (hasData) {
        // Use existing data
        nutritionData = store.dailyNutrition;
        console.log('Using stored data for:', newFormattedDate);
      } else {
        // Fetch nutrition data only if we don't have it
        nutritionData = await fetchDailyNutrition(date);
      }
      
      if (nutritionData) {
        // Update macros if data changed
        if (!isEqual(nutritionData, dailyNutrition)) {
          console.log('Updating macros for:', newFormattedDate);
          resetMacros();
          addMacros(
            nutritionData.protein || 0,
            nutritionData.carbs || 0,
            nutritionData.fats || 0
          );
          if (addCalories) {
            addCalories(nutritionData.calories || 0);
          }
        }
        
        // Always update meals state to ensure UI is in sync
        setMeals(nutritionData.meals || []);
      }
    } catch (error) {
      console.error('Error handling date selection:', error);
    }
  }, [fetchDailyNutrition, resetMacros, addMacros, addCalories, selectedDate, dailyNutrition]);

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
    if (params?.addMeal && params?.addMeal !== prevAddMeal) {
      const newMeal = params.addMeal;
      setPrevAddMeal(newMeal);
      
      // Save meal and update nutrition
      (async () => {
        try {
          setLoadingStates(prev => ({ ...prev, saving: true }));
          await saveMealToBackend(newMeal, selectedDate);
          
          // Force refresh nutrition data
          await fetchDailyNutrition(selectedDate, true);
          
          // Update local state with new meal
          setMeals(prevMeals => [...prevMeals, newMeal]);
          
          // Update progress if provided
          if (params.updateProgress && params.updateProgress !== prevUpdateProgress) {
            setPrevUpdateProgress(params.updateProgress);
            const { calories, carbs, protein, fats } = params.updateProgress;
            
            // Reset before adding new values
            resetMacros();
            resetCalories();
            
            // Add new values
            addMacros(
              Number(protein) || 0,
              Number(carbs) || 0,
              Number(fats) || 0
            );
            if (addCalories) {
              addCalories(Number(calories) || 0);
            }
          }
        } catch (error) {
          console.error('Error handling camera return:', error);
          Alert.alert('Error', 'Failed to update nutrition data');
        } finally {
          setLoadingStates(prev => ({ ...prev, saving: false }));
        }
      })();
    }
  }, [route.params, prevAddMeal, prevUpdateProgress, selectedDate, saveMealToBackend, 
      fetchDailyNutrition, resetMacros, resetCalories, addMacros, addCalories]);

  // Get daily nutrition data and force refresh when meals change
  useEffect(() => {
    if (selectedDate) {
      // Only fetch if we don't have data for this date
      const store = useNutritionStore.getState();
      const currentFormattedDate = formatDate(selectedDate);
      const hasData = store.dailyNutrition && store.currentDate === currentFormattedDate;
      
      if (!hasData) {
        fetchDailyNutrition(selectedDate);
      }
    }
  }, [selectedDate]); // Only depend on selectedDate

  // Sync meals with nutrition data
  useEffect(() => {
    if (dailyNutrition) {
      setMeals(dailyNutrition.meals || []);
    }
  }, [dailyNutrition]);

  // Memoize FAB onPress handler
  const handleFABPress = useCallback(() => {
    navigation.navigate('Camera');
  }, [navigation]);

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

  const renderRecentlyEaten = useMemo(() => (
    <MemoizedRecentlyEaten
      meals={meals}
      isLoading={loadingStates.nutrition}
    />
  ), [meals, loadingStates.nutrition]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image 
          source={require('../../assets/images/panda-looking-over.jpg')}
          style={styles.logo}
        />
        <View style={styles.calendarContainer}>
          <MemoizedWeekCalendar 
            onDateSelect={handleDateSelect} 
            selectedDate={selectedDate} 
          />
        </View>
        <MemoizedCalorieProgress nutrients={nutrients} />
        <View style={styles.recentlyEatenContainer}>
          <Text style={styles.sectionTitle}>Recently Eaten</Text>
          {renderRecentlyEaten}
        </View>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleFABPress}
        />
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  calendarContainer: {
    marginBottom: 12,
  },
  recentlyEatenContainer: {
    flex: 1,
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    elevation: 4,
  },
});

export default HomeScreen;
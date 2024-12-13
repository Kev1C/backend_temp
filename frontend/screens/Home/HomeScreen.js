// frontend/screens/Home/HomeScreen.js
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, SafeAreaView, View, Image, FlatList, ScrollView, StyleSheet } from 'react-native';
import { useTheme, FAB } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import createStyles from './HomeScreenStyles';
import { useCalorieStore } from '../../hooks/useCalorieTracker';
import useMacroStore from '../../hooks/useMacroTracker';
import useNutrientCalculations from '../../hooks/useNutrientCalculations';
import { MemoizedWeekCalendar, MemoizedCalorieProgress, MemoizedRecentlyEaten } from './MemoizedComponents';
import { api } from '../../services/api';
import isEqual from 'lodash/isEqual';

const HomeScreen = () => {
  const { user, authToken, isGuest } = useAuthStore();
  const { onboardingData, isOnboardingComplete } = useOnboardingStore();
  const { calculatedNutrients, loading: loadingNutrients, fetchCalculations } = useNutrientCalculations();
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

  // Fetch nutrient calculations when user and onboarding data are available
  useEffect(() => {
    if (user && onboardingData && isOnboardingComplete) {
      const userData = {
        ...onboardingData,
        // Ensure we have the correct property name
        fitnessGoal: onboardingData.goal || onboardingData.fitnessGoal
      };
      fetchCalculations(userData);
    }
  }, [user, onboardingData, isOnboardingComplete, fetchCalculations]);

  // Get daily nutrition data
  const { 
    dailyNutrition, 
    isLoading: isLoadingNutrition, 
    fetchDailyNutrition 
  } = useNutritionStore();

  // Get calorie data
  const { calories, addCalories, resetCalories } = useCalorieStore();

  // Get macro data
  const macroStore = useMacroStore();
  const { macros, addMacros, resetMacros, checkDailyReset, hydrated } = macroStore;

  // State for recently eaten meals
  const [recentMeals, setRecentMeals] = useState([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());  // Initialize with current date
  const [prevAddMeal, setPrevAddMeal] = useState(null);
  const [prevUpdateProgress, setPrevUpdateProgress] = useState(null);

  // Check for daily macro reset
  useEffect(() => {
    if (hydrated) {
      checkDailyReset();
    }
  }, [hydrated, checkDailyReset]);

  // Memoize fetchRecentMeals to prevent recreation on every render
  const fetchRecentMeals = useCallback(async (date) => {
    try {
      setLoadingStates(prev => ({ ...prev, meals: true }));

      // Format date to YYYY-MM-DD in local timezone
      const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

      if (isGuest) {
        // Get meals from local storage for guest mode
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
  }, [isGuest]); // Add isGuest to dependency array

  // Add function to save guest meal data
  const saveGuestMealData = useCallback(async (meal, date) => {
    try {
      setLoadingStates(prev => ({ ...prev, saving: true }));
      const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
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
  }, []);

  // Handle date selection from calendar - memoized to prevent unnecessary re-renders
  const handleDateSelect = useCallback(async (date) => {
    setSelectedDate(date);
  }, []);

  // Redirect to onboarding if not complete
  useEffect(() => {
    // Only check once when component mounts
    const checkOnboarding = async () => {
      if (user && !isOnboardingComplete) {
        await useOnboardingStore.getState().resetOnboarding();
      }
    };
    checkOnboarding();
  }, []); // Empty dependency array - only run on mount

  // Fetch meals and nutrition data when date changes
  useEffect(() => {
    if (!authToken && !isGuest) return;
  
    const fetchData = async () => {
      if (selectedDate) {
        console.log('Fetching data for date:', selectedDate);
        try {
          // Use Promise.all for parallel fetching
          await Promise.all([
            fetchRecentMeals(selectedDate),
            // Pass false as second argument to use cache if available
            fetchDailyNutrition(selectedDate, false)
          ]);
        } catch (error) {
          console.error('Error fetching nutrition data:', error);
        }
      }
    };
  
    fetchData();
  }, [selectedDate, authToken, isGuest, fetchRecentMeals, fetchDailyNutrition]); // Add proper dependencies

  // Update macros when daily nutrition data changes
  useEffect(() => {
    console.log('Daily nutrition update triggered:', dailyNutrition);
  
    // Skip if dailyNutrition is completely null
    if (!dailyNutrition) {
      console.log('Skipping update due to null dailyNutrition');
      return;
    }

    // Extract and update nutrition data, defaulting to 0 if values are missing
    const nutritionData = {
      calories: Number(dailyNutrition.calories) || 0,
      protein: Number(dailyNutrition.protein) || 0,
      carbs: Number(dailyNutrition.carbs) || 0,
      fat: Number(dailyNutrition.fat) || 0
    };
  
    console.log('Updating nutrition with:', nutritionData);
  
    // Update macros and calories
    resetCalories();
    resetMacros();
    addMacros(nutritionData.protein, nutritionData.carbs, nutritionData.fat);
    addCalories(nutritionData.calories);
  }, [dailyNutrition]);

  // Memoize nutrients data for display
  const nutrients = useMemo(() => ({
    current: {
      calories,
      ...macros
    },
    goals: calculatedNutrients,
    loading: loadingNutrients || isLoadingNutrition
  }), [calories, macros, calculatedNutrients, loadingNutrients, isLoadingNutrition]);

  // Handle updates from camera screen with loading states
  useEffect(() => {
    if (route.params?.addMeal && route.params?.updateProgress) {
      const { addMeal, updateProgress } = route.params;

      const handleNewMeal = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, saving: true }));

          // Update dailyNutrition state here
          // Removed since we now have a dedicated store

          // Update macros
          addMacros(
            Number(updateProgress.protein),
            Number(updateProgress.carbs),
            Number(updateProgress.fats)
          );

          // Update calories
          if (addCalories) addCalories(Number(updateProgress.calories));

          if (isGuest) {
            await saveGuestMealData(addMeal, selectedDate);
          } else {
            setRecentMeals(prevMeals => [...prevMeals, addMeal]);
          }

          // Fetch daily nutrition after adding a new meal
          await fetchDailyNutrition(selectedDate);
        } catch (error) {
          console.error('Error handling new meal:', error);
        } finally {
          setLoadingStates(prev => ({ ...prev, saving: false }));
        }
      };

      handleNewMeal();
    }
  }, [route.params, selectedDate, isGuest, fetchRecentMeals, saveGuestMealData, fetchDailyNutrition]);

  // Memoize FAB onPress handler
  const handleFABPress = useCallback(() => {
    navigation.navigate('Camera');
  }, [navigation]);

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
          <MemoizedRecentlyEaten 
            meals={recentMeals} 
            isLoading={loadingStates.meals}
          />
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

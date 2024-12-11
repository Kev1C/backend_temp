// frontend/screens/Home/HomeScreen.js
import React, { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { Text, SafeAreaView, View, Image, FlatList, ScrollView, StyleSheet, AsyncStorage } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useTheme, FAB } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import createStyles from './HomeScreenStyles';
import useCalorieTracker from '../../hooks/useCalorieTracker';
import useNutrientCalculations from '../../hooks/useNutrientCalculations';
import useMacroTracker from '../../hooks/useMacroTracker';
import useDailyNutrition from '../../hooks/useDailyNutrition';
import { MemoizedWeekCalendar, MemoizedCalorieProgress, MemoizedRecentlyEaten } from './MemoizedComponents';
import { api, cachedGet } from '../../services/api';
import { OnboardingContext } from '../../context/OnboardingContext';
import isEqual from 'lodash/isEqual';

const HomeScreen = () => {
  const { user, authToken, isGuest } = useContext(AuthContext);
  const { onboardingData } = useContext(OnboardingContext);
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

  // Get calculated nutrients (these are the daily goals)
  const calculatedNutrients = useNutrientCalculations();

  // State for recently eaten meals
  const [recentMeals, setRecentMeals] = useState([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());  // Initialize with current date
  const [prevAddMeal, setPrevAddMeal] = useState(null);
  const [prevUpdateProgress, setPrevUpdateProgress] = useState(null);

  // Get daily nutrition data
  const { 
    dailyNutrition, 
    fetchDailyNutrition,
    setDailyNutrition,
    isLoading: isLoadingNutrition 
  } = useDailyNutrition();

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

      const response = await cachedGet('/meals/recent', { 
        params: { date: formattedDate },
        cacheKey: `meals-${formattedDate}`,
        cacheTime: 5 * 60 * 1000,
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

  // Custom Hooks for trackers
  const {
    macros,
    addMacros,
    resetMacros,
  } = useMacroTracker();

  const {
    calories,
    addCalories,
    resetCalories,
  } = useCalorieTracker();

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (user && !onboardingData.isOnboardingComplete) {
      navigation.navigate('Onboarding');
      return;
    }
  }, [user, onboardingData, navigation]);

  // Fetch meals and nutrition data when date changes
  useEffect(() => {
    if (!authToken && !isGuest) return;
  
    const fetchData = async () => {
      if (selectedDate) {
        console.log('Fetching data for date:', selectedDate);
        try {
          await Promise.all([
            fetchRecentMeals(selectedDate),
            fetchDailyNutrition(selectedDate)
          ]);
        } catch (error) {
          console.error('Error fetching nutrition ', error);
        }
      }
    };
  
    fetchData();
  }, [selectedDate, authToken, isGuest, fetchDailyNutrition, fetchRecentMeals]);

  // Update macros when daily nutrition data changes
  useEffect(() => {
    console.log('Daily nutrition update triggered:', dailyNutrition);
  
    // Skip if dailyNutrition is null or empty
    if (!dailyNutrition || Object.values(dailyNutrition).every(v => !v || (Array.isArray(v) && !v.length))) {
      console.log('Skipping update due to null or empty dailyNutrition');
      return;
    }
  
    // Extract and update nutrition data
    const nutritionData = {
      calories: Number(dailyNutrition.calories) || 0,
      protein: Number(dailyNutrition.protein) || 0,
      carbs: Number(dailyNutrition.carbs) || 0,
      fat: Number(dailyNutrition.fat) || 0
    };
  
    console.log('Updating nutrition with:', nutritionData);
  
    // Update macros and calories
    resetMacros();
    resetCalories();
    addMacros(nutritionData.protein, nutritionData.carbs, nutritionData.fat);
    addCalories(nutritionData.calories);
  }, [dailyNutrition, resetMacros, resetCalories, addMacros, addCalories]);
  

  // Memoize nutrients data
  const nutrients = useMemo(() => ({
    calories: dailyNutrition?.calories || 0,
    caloriesGoal: calculatedNutrients?.calories || 0,
    carbs: dailyNutrition?.carbs || 0,
    carbsGoal: calculatedNutrients?.carbs || 0,
    fat: dailyNutrition?.fat || 0,
    fatGoal: calculatedNutrients?.fat || 0,
    protein: dailyNutrition?.protein || 0,
    proteinGoal: calculatedNutrients?.protein || 0,
  }), [dailyNutrition, calculatedNutrients]);

  console.log('HomeScreen nutrient goals:', calculatedNutrients);

  // Handle updates from camera screen with loading states
  useEffect(() => {
    if (route.params?.addMeal && route.params?.updateProgress) {
      const { addMeal, updateProgress } = route.params;

      const handleNewMeal = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, saving: true }));

          // Update dailyNutrition state here
          setDailyNutrition(prevDailyNutrition => {
            const updatedNutrition = {
              ...prevDailyNutrition,
              calories: (Number(prevDailyNutrition?.calories || 0) + Number(updateProgress.calories)).toString(),
              carbs: (Number(prevDailyNutrition?.carbs || 0) + Number(updateProgress.carbs)).toString(),
              protein: (Number(prevDailyNutrition?.protein || 0) + Number(updateProgress.protein)).toString(),
              fat: (Number(prevDailyNutrition?.fat || 0) + Number(updateProgress.fats)).toString(),
              meals: [...(prevDailyNutrition?.meals || []), addMeal],
            };
            console.log('Updated daily nutrition:', updatedNutrition);
            return updatedNutrition;
          });

          // Update macros
          addMacros(
            Number(updateProgress.protein),
            Number(updateProgress.carbs),
            Number(updateProgress.fats)
          );

          // Update calories
          addCalories(Number(updateProgress.calories));

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
  }, [route.params, selectedDate, isGuest, fetchRecentMeals, saveGuestMealData, setDailyNutrition, fetchDailyNutrition]);

  console.log('Current macro progress:', macros);
  console.log('Daily nutrition ', dailyNutrition);

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

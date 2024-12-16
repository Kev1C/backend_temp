// frontend/screens/Home/HomeScreen.js
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, SafeAreaView, View, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native';
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
    setSelectedDate(date);
    
    // Reset macros and calories before fetching new data
    resetMacros();
    if (resetCalories) resetCalories();
    
    // Fetch new data
    const nutritionData = await fetchDailyNutrition(date);
    const mealsData = await fetchRecentMeals(date);
    
    // Update macros and calories with the fetched data
    if (nutritionData) {
      addMacros(
        nutritionData.protein || 0,
        nutritionData.carbs || 0,
        nutritionData.fats || 0
      );
      if (addCalories) {
        addCalories(nutritionData.calories || 0);
      }
    }
  }, [fetchDailyNutrition, fetchRecentMeals, resetMacros, resetCalories, addMacros, addCalories]);

  // Load initial data
  useEffect(() => {
    if (selectedDate) {
      handleDateSelect(selectedDate);
    }
  }, []); // Only run on mount

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

  // Memoize fetchRecentMeals to prevent recreation on every render
  const fetchRecentMeals = useCallback(async (date) => {
    try {
      setLoadingStates(prev => ({ ...prev, meals: true }));
      const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

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
  }, [isGuest]);

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

  // Save meal to backend
  const saveMealToBackend = async (meal, date) => {
    try {
      setLoadingStates(prev => ({ ...prev, saving: true }));
      const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      
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
      
      // Update local state immediately for better UX
      setRecentMeals(prevMeals => [newMeal, ...prevMeals]);
      
      // Update nutrition progress
      if (params.updateProgress) {
        const { calories, carbs, protein, fats } = params.updateProgress;
        
        // Update calories
        if (addCalories) {
          addCalories(Number(calories));
        }
        
        // Update macros with individual parameters
        addMacros(
          Number(protein),
          Number(carbs),
          Number(fats)
        );

        // Fetch updated daily nutrition data
        fetchDailyNutrition(selectedDate);
      }
      
      // Save to backend
      saveMealToBackend(newMeal, selectedDate);
      
      // Clear the params to prevent duplicate updates
      navigation.setParams({ addMeal: null, updateProgress: null });
    }
  }, [route.params, addCalories, addMacros, selectedDate, saveMealToBackend, fetchDailyNutrition]);

  // Memoize FAB onPress handler
  const handleFABPress = useCallback(() => {
    navigation.navigate('Camera');
  }, [navigation]);

  // Memoize nutrients data for display
  const nutrients = useMemo(() => {
    // Don't show any goals until calculations are complete
    if (loadingNutrients || !calculatedNutrients) {
      return {
        current: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        goals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        loading: true
      };
    }

    // Get daily nutrition from the nutrition store
    const dailyNutritionData = dailyNutrition || {};

    return {
      current: {
        calories: dailyNutritionData.calories || 0,
        protein: dailyNutritionData.protein || 0,
        carbs: dailyNutritionData.carbs || 0,
        fat: dailyNutritionData.fat || 0
      },
      goals: {
        calories: calculatedNutrients?.calories || 0,
        protein: calculatedNutrients?.protein || 0,
        carbs: calculatedNutrients?.carbs || 0,
        fat: calculatedNutrients?.fat || 0
      },
      loading: false
    };
  }, [dailyNutrition, calculatedNutrients, loadingNutrients]);

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
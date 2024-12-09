// frontend/screens/Home/HomeScreen.js
import React, { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { Text, SafeAreaView, View, Image, FlatList, ScrollView, StyleSheet } from 'react-native';
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

const HomeScreen = () => {
  const { user, authToken, isGuest } = useContext(AuthContext);
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Check for authentication and handle guest mode
  useEffect(() => {
    if (!authToken && !isGuest) {
      navigation.replace('Profile');
      return;
    }
  }, [authToken, isGuest, navigation]);

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
  } = useDailyNutrition(selectedDate);

  // Memoize fetchRecentMeals to prevent recreation on every render
  const fetchRecentMeals = useCallback(async (date) => {
    try {
      setIsLoadingMeals(true);
      
      // Handle guest mode
      if (isGuest) {
        // Use local storage or temporary state for guest mode
        setRecentMeals([]);
        return;
      }

      // Format date to YYYY-MM-DD in local timezone
      const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      
      const response = await cachedGet('/meals/recent', { 
        params: { date: formattedDate },
        // Add cache configuration
        cacheKey: `meals-${formattedDate}`,
        cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      });
      setRecentMeals(response.data);
    } catch (error) {
      console.error('Error fetching recent meals:', error);
      setRecentMeals([]);
    } finally {
      setIsLoadingMeals(false);
    }
  }, [isGuest]); // Add isGuest to dependency array

  // Handle date selection from calendar - memoized to prevent unnecessary re-renders
  const handleDateSelect = useCallback(async (date) => {
    setSelectedDate(date);
  }, []);

  // Custom Hooks for trackers
  const {
    macros,
    addMacros,
    resetMacros,
  } = useMacroTracker(
    calculatedNutrients.protein,
    calculatedNutrients.carbs,
    calculatedNutrients.fat
  );

  const {
    calories,
    addCalories,
    resetCalories,
  } = useCalorieTracker(0, calculatedNutrients.calories);

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
          console.error('Error fetching nutrition data:', error);
        }
      }
    };
    
    fetchData();
  }, [selectedDate, authToken, isGuest]); // Remove fetchRecentMeals and fetchDailyNutrition from deps

  // Update macros when daily nutrition data changes
  useEffect(() => {
    console.log('Daily nutrition update triggered:', dailyNutrition);
    
    if (!dailyNutrition) return;
    
    resetMacros();
    resetCalories();
    
    const nutritionData = {
      calories: Number(dailyNutrition.calories) || 0,
      protein: Number(dailyNutrition.protein) || 0,
      carbs: Number(dailyNutrition.carbs) || 0,
      fat: Number(dailyNutrition.fat) || 0
    };
    
    console.log('Updating nutrition with:', nutritionData);
    
    addMacros(
      nutritionData.protein,
      nutritionData.carbs,
      nutritionData.fat
    );
    
    addCalories(nutritionData.calories);
  }, [dailyNutrition]); // Update whenever dailyNutrition changes

  // Memoize nutrients data
  const nutrients = useMemo(() => ({
    calories: dailyNutrition?.calories || 0,
    caloriesGoal: calculatedNutrients.calories,
    carbs: dailyNutrition?.carbs || 0,
    carbsGoal: calculatedNutrients.carbs,
    fat: dailyNutrition?.fat || 0,
    fatGoal: calculatedNutrients.fat,
    protein: dailyNutrition?.protein || 0,
    proteinGoal: calculatedNutrients.protein,
  }), [dailyNutrition, calculatedNutrients]);

  console.log('HomeScreen nutrient goals:', calculatedNutrients);

  // Handle updates from camera screen
  useEffect(() => {
    if (route.params?.addMeal && route.params?.updateProgress) {
      const { addMeal, updateProgress } = route.params;
      console.log('New meal added:', addMeal);
      console.log('Progress update:', updateProgress);
  
      // Check if addMeal and updateProgress are the same as the previous values
      if (addMeal === prevAddMeal && updateProgress === prevUpdateProgress) {
        return;
      }
  
      // Update the previous values
      setPrevAddMeal(addMeal);
      setPrevUpdateProgress(updateProgress);
      
      // Update UI immediately for better user experience
      const newMeal = {
        ...addMeal,
        id: Date.now(), // Temporary ID that will be replaced with server ID
        createdAt: new Date().toISOString(),
        date: selectedDate
      };
      
      // Update meals list immediately
      setRecentMeals(prevMeals => [newMeal, ...prevMeals]);
      
      // Update nutrition totals immediately for responsive UI
      setDailyNutrition(prevNutrition => {
        const currentNutrition = prevNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] };
        const updatedNutrition = {
          calories: Number(currentNutrition.calories || 0) + Number(addMeal.calories || 0),
          protein: Number(currentNutrition.protein || 0) + Number(addMeal.protein || 0),
          carbs: Number(currentNutrition.carbs || 0) + Number(addMeal.carbs || 0),
          fat: Number(currentNutrition.fat || 0) + Number(addMeal.fats || 0),
          meals: [newMeal, ...(currentNutrition.meals || [])]
        };
        
        // Update calorie and macro trackers
        resetMacros();
        resetCalories();
        addMacros(
          updatedNutrition.protein,
          updatedNutrition.carbs,
          updatedNutrition.fat
        );
        addCalories(updatedNutrition.calories);
        
        return updatedNutrition;
      });
      
      // Only save to backend if not in guest mode
      if (!isGuest) {
        api.post('/meals', addMeal)
          .then(response => {
            console.log('Meal saved successfully:', response.data);
            
            // Update the meal with the server response data
            setRecentMeals(prevMeals => 
              prevMeals.map(meal => 
                meal.id === newMeal.id ? { ...response.data } : meal
              )
            );
            
            // Force refresh nutrition data to ensure consistency
            fetchDailyNutrition(selectedDate, true);
          })
          .catch(error => {
            console.error('Error saving meal:', error);
            // Remove the meal if saving failed
            setRecentMeals(prevMeals => 
              prevMeals.filter(meal => meal.id !== newMeal.id)
            );
            // Revert nutrition data
            setDailyNutrition(prevNutrition => {
              const currentNutrition = prevNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] };
              return {
                calories: Number(currentNutrition.calories || 0) - Number(addMeal.calories || 0),
                protein: Number(currentNutrition.protein || 0) - Number(addMeal.protein || 0),
                carbs: Number(currentNutrition.carbs || 0) - Number(addMeal.carbs || 0),
                fat: Number(currentNutrition.fat || 0) - Number(addMeal.fats || 0),
                meals: currentNutrition.meals.filter(m => m.id !== newMeal.id)
              };
            });
          })
          .finally(() => {
            // Clear route params after handling the new meal
            navigation.setParams({ addMeal: null, updateProgress: null });
          });
      } else {
        // Handle guest mode - just clear params since we've already updated the UI
        navigation.setParams({ addMeal: null, updateProgress: null });
      }
    }
  }, [route.params, navigation, isGuest, selectedDate, fetchDailyNutrition, 
     prevAddMeal, prevUpdateProgress, setDailyNutrition, 
     resetMacros, resetCalories, addMacros, addCalories]);

  console.log('Current macro progress:', macros);
  console.log('Daily nutrition data:', dailyNutrition);

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
            isLoading={isLoadingMeals}
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

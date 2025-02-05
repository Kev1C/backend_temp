// frontend/screens/Home/HomeScreen.js
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, View, Image, FlatList, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
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
import DiamondChest from '../../assets/images/cropped.png';

const HomeScreen = () => {
  const { user, authToken, isGuest } = useAuthStore();
  const { onboardingData, isOnboardingComplete, isNewUser, markUserAsSeen } = useOnboardingStore();
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

  // State to control display of the welcome modal
  const [showModal, setShowModal] = useState(false);

  // Add new state variable for managing read more toggle
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Check if the onboarding process is complete and the user is new
    if (isOnboardingComplete && isNewUser) {
      setShowModal(true);
    }
  }, [isOnboardingComplete, isNewUser]);

  const handleCloseModal = () => {
    setShowModal(false);
    // Update the flag so that the modal does not display again
    markUserAsSeen();
  };

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
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <MemoizedWeekCalendar 
            onDateSelect={handleDateSelect} 
            selectedDate={selectedDate} 
          />
          <MemoizedCalorieProgress nutrients={nutrients} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent: 'space-between', marginVertical: 8 }}>
          <Text style={styles.sectionTitle}>Recently Eaten</Text>
          <TouchableOpacity style={{ marginLeft: 100 }} onPress={() => { /* TODO: implement diamond button action */ }}>
            <Image source={DiamondChest} style={{ width: 58, height: 58,resizeMode: 'contain' }} />
          </TouchableOpacity>
          {/* <NativeAdComponent /> */}
        </View>
        <MemoizedRecentlyEaten {...mealsData} />
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 }]}
          onPress={() => navigation.navigate('Camera')}
        />
      </View>
      <Modal
        visible={showModal}
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 20,
            borderRadius: 8,
            maxWidth: 500,
            width: '90%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>Hooray! You're In!</Text>
            <Text style={{ textAlign: 'center', marginVertical: 5 }}>Time to take control of your nutrition!</Text>
            <Text style={{ textAlign: 'center', marginVertical: 5 }}>
              We've added <Text style={{ fontWeight: 'bold', color: '#FFA500' }}>6500 shiny diamonds</Text> to your account to kick things off! 💎
            </Text>
            <Text style={{ textAlign: 'center', marginVertical: 5 }}>Use them to power up your food tracking with our Food Scanner. Get instant calorie and macro counts by simply taking a picture of your meal.</Text>
            {/* Read more toggle for the diamond info */}
            {!expanded ? (
              <Text onPress={() => setExpanded(true)} style={{ color: '#007bff', marginVertical: 5 }}>
                Read more
              </Text>
            ) : (
              <Text style={{ textAlign: 'center', marginVertical: 5 }}>
                Diamonds unlock our Food Scanner: Use them to instantly analyze your meals with your camera and get detailed nutrition data. It's the fastest way to log your food!
                <Text onPress={() => setExpanded(false)} style={{ color: '#007bff' }}> Read less</Text>
              </Text>
            )}
            <Text 
              onPress={handleCloseModal}
              style={{
                marginTop: 20,
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: '#007bff',
                color: '#fff',
                borderRadius: 4
              }}
            >Got it!</Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default HomeScreen;
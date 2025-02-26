import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, View, Image, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, FAB } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { useNutritionStore, formatDate } from '../../stores/nutritionStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useCalorieStore } from '../../hooks/useCalorieTracker';
import useMacroStore from '../../hooks/useMacroTracker';
import useNutrientCalculations from '../../hooks/useNutrientCalculations';
import {
  MemoizedWeekCalendar,
  MemoizedCalorieProgress,
  MemoizedRecentlyEaten,
} from './MemoizedComponents';
import HomescreenAdComponent from '../../Components/HomescreenAdComponent';
import WelcomeMessageModal from '../../Components/WelcomeMessageModal';
import { api } from '../../services/api';
import createStyles from './HomeScreenStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DiamondChest from '../../assets/images/cropped.png';

const HomeScreen = () => {
  const { user, isGuest } = useAuthStore();
  const { onboardingData, isOnboardingComplete, isNewUser, markUserAsSeen } = useOnboardingStore();
  const { calculatedNutrients, fetchCalculations } = useNutrientCalculations();
  const { fetchDailyNutrition, dailyNutrition, isLoading: isLoadingNutrition, updateDailyNutrition } = useNutritionStore();
  const { addCalories } = useCalorieStore();
  const { addMacros, resetMacros, checkDailyReset, hydrated } = useMacroStore();

  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    meals: false,
    nutrition: false,
    saving: false,
  });
  const [recentMeals, setRecentMeals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOnboardingComplete && isNewUser) {
      setShowWelcomeModal(true);
    }
  }, [isOnboardingComplete, isNewUser]);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    markUserAsSeen();
  };

  useEffect(() => {
    const initializeNutrients = async () => {
      if (user && onboardingData && isOnboardingComplete) {
        const userData = {
          ...onboardingData,
          fitnessGoal: onboardingData.goal || onboardingData.fitnessGoal,
        };
        try {
          await fetchCalculations(userData);
          resetMacros();
        } catch (error) {
          console.error('Error initializing nutrients:', error);
        }
      }
    };
    initializeNutrients();
  }, [user, onboardingData, isOnboardingComplete, fetchCalculations, resetMacros]);

  const handleDateSelect = useCallback(
    async (date) => {
      if (!date) return;
      const newFormattedDate = formatDate(date);
      const currentFormattedDate = selectedDate ? formatDate(selectedDate) : null;
      if (currentFormattedDate === newFormattedDate && dailyNutrition) return;
      setSelectedDate(date);
      await fetchDailyNutrition(date);
    },
    [selectedDate, dailyNutrition, fetchDailyNutrition]
  );

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

  const fetchRecentMeals = useCallback(
    async (date) => {
      try {
        setLoadingStates((prev) => ({ ...prev, meals: true }));
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
        setLoadingStates((prev) => ({ ...prev, meals: false }));
      }
    },
    [isGuest]
  );

  const saveGuestMealData = useCallback(
    async (meal, date) => {
      try {
        setLoadingStates((prev) => ({ ...prev, saving: true }));
        const formattedDate = formatDate(date);
        const storedMeals = await AsyncStorage.getItem(`guest-meals-${formattedDate}`);
        const currentMeals = storedMeals ? JSON.parse(storedMeals) : [];
        const updatedMeals = [...currentMeals, meal];
        await AsyncStorage.setItem(`guest-meals-${formattedDate}`, JSON.stringify(updatedMeals));
        setRecentMeals(updatedMeals);
      } catch (error) {
        console.error('Error saving guest meal:', error);
      } finally {
        setLoadingStates((prev) => ({ ...prev, saving: false }));
      }
    },
    []
  );

  const saveMealToBackend = async (meal, date) => {
    try {
      setLoadingStates((prev) => ({ ...prev, saving: true }));
      const formattedDate = formatDate(date);
      if (isGuest) {
        await saveGuestMealData(meal, date);
      } else {
        await api.post('/meals', {
          ...meal,
          date: formattedDate,
        });
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    } finally {
      setLoadingStates((prev) => ({ ...prev, saving: false }));
    }
  };

  useEffect(() => {
    const params = route.params;
    if (params?.addMeal) {
      const newMeal = params.addMeal;
      (async () => {
        try {
          setLoadingStates((prev) => ({ ...prev, saving: true }));
          // Update nutrition data (invalidate caches and fetch fresh data)
          await updateDailyNutrition(selectedDate, newMeal);
          // Save the meal to backend (or locally in guest mode)
          await saveMealToBackend(newMeal, selectedDate);
          // Force a refresh of daily nutrition.
          await fetchDailyNutrition(selectedDate, true);
        } catch (error) {
          console.error('Error handling camera return:', error);
          Alert.alert('Error', 'Failed to update nutrition data');
        } finally {
          setLoadingStates((prev) => ({ ...prev, saving: false }));
        }
      })();
    }
  }, [route.params, selectedDate, saveMealToBackend, updateDailyNutrition, fetchDailyNutrition]);

  useEffect(() => {
    if (hydrated) {
      checkDailyReset();
    }
  }, [hydrated, checkDailyReset]);

  useEffect(() => {
    if (dailyNutrition && selectedDate) {
      const formattedDate = formatDate(selectedDate);
      const nutritionDate = formatDate(new Date(dailyNutrition.date));
      if (formattedDate === nutritionDate) {
        console.log('Updating UI with new nutrition data');
        resetMacros();
        addMacros(
          dailyNutrition.protein || 0,
          dailyNutrition.carbs || 0,
          dailyNutrition.fats || 0
        );
        if (addCalories) {
          addCalories(dailyNutrition.calories || 0);
        }
      }
    }
  }, [dailyNutrition, selectedDate, resetMacros, addMacros, addCalories]);

  const nutrients = useMemo(() => {
    if (!dailyNutrition) {
      return {
        current: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        goals: calculatedNutrients || { calories: 0, protein: 0, carbs: 0, fats: 0 },
        loading: isLoadingNutrition,
      };
    }
    return {
      current: {
        calories: Number(dailyNutrition.calories || 0),
        protein: Number(dailyNutrition.protein || 0),
        carbs: Number(dailyNutrition.carbs || 0),
        fats: Number(dailyNutrition.fats || 0),
      },
      goals: calculatedNutrients || { calories: 0, protein: 0, carbs: 0, fats: 0 },
      loading: isLoadingNutrition,
    };
  }, [dailyNutrition, calculatedNutrients, isLoadingNutrition]);

  const mealsData = useMemo(() => ({
    meals: dailyNutrition?.meals || [],
    isLoading: isLoadingNutrition || loadingStates.saving,
  }), [dailyNutrition?.meals, isLoadingNutrition, loadingStates.saving]);

  // Refresh nutrition data every time HomeScreen comes into focus.
  useFocusEffect(
    useCallback(() => {
      fetchDailyNutrition(selectedDate, true);
    }, [selectedDate, fetchDailyNutrition])
  );

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <MemoizedWeekCalendar onDateSelect={handleDateSelect} selectedDate={selectedDate} />
          <MemoizedCalorieProgress nutrients={nutrients} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
          <Text style={styles.sectionTitle}>Recently Eaten</Text>
          <HomescreenAdComponent />
        </View>
        <MemoizedRecentlyEaten {...mealsData} />
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 }]}
          onPress={() => navigation.navigate('Camera')}
        />
      </View>
      <WelcomeMessageModal visible={showWelcomeModal} onClose={handleCloseWelcome} />
    </>
  );
};

export default HomeScreen;

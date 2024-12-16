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
  const { 
    nutritionalGoals, 
    setNutritionalGoals, 
    dailyNutrition, 
    fetchDailyNutrition,
    updateDailyNutrition
  } = useNutritionStore();
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedDate, setSelectedDate] = useState(new Date());
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
        fitnessGoal: onboardingData.goal || onboardingData.fitnessGoal
      };
      fetchCalculations(userData).then(calculations => {
        if (calculations) {
          setNutritionalGoals(calculations);
        }
      });
    }
  }, [user, onboardingData, isOnboardingComplete, fetchCalculations, setNutritionalGoals]);

  // Prepare nutrition data for CalorieProgress
  const nutritionData = useMemo(() => ({
    calories: dailyNutrition?.calories || 0,
    caloriesGoal: nutritionalGoals.calories || 0,
    protein: dailyNutrition?.protein || 0,
    proteinGoal: nutritionalGoals.protein || 0,
    carbs: dailyNutrition?.carbs || 0,
    carbsGoal: nutritionalGoals.carbs || 0,
    fat: dailyNutrition?.fat || 0,
    fatGoal: nutritionalGoals.fat || 0
  }), [dailyNutrition, nutritionalGoals]);

  // Handle date selection
  const handleDateSelect = useCallback(async (date) => {
    setSelectedDate(date);
    setLoadingStates(prev => ({ ...prev, nutrition: true }));
    try {
      await fetchDailyNutrition(date);
    } catch (error) {
      console.error('Error fetching nutrition:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, nutrition: false }));
    }
  }, [fetchDailyNutrition]);

  // Load initial data
  useEffect(() => {
    if (user) {
      handleDateSelect(new Date());
    }
  }, [user, handleDateSelect]);

  const handleFABPress = useCallback(() => {
    navigation.navigate('AddMeal');
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
        <MemoizedCalorieProgress nutrients={nutritionData} />
        <View style={styles.recentlyEatenContainer}>
          <Text style={styles.sectionTitle}>Recently Eaten</Text>
          <MemoizedRecentlyEaten 
            meals={dailyNutrition?.meals || []} 
            isLoading={loadingStates.nutrition}
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

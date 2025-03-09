// frontend/screens/Profile/ProfileScreen.js

import React, { useCallback, useMemo, useEffect, useState, lazy, Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Title, Caption, Text } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNutritionStore } from '../../stores/nutritionStore';
import { useCacheStore } from '../../stores/cacheStore';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Lazy load heavy components
const MacroNutrientsChart = lazy(() => import('../../Components/MacroNutrientsChart'));
const NutritionHeatmap = lazy(() => import('../../Components/NutritionHeatmap'));

const ProfileScreen = ({ navigation }) => {
  const { user, isLoading: userLoading, isAuthenticated } = useAuthStore();
  const theme = useTheme();
  const cache = useCacheStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const insets = useSafeAreaInsets();

  const {
    nutritionalGoals,
    heatmapData,
    isLoadingHeatmap,
    heatmapError,
    fetchHeatmapData,
    currentStreak
  } = useNutritionStore();

  const loading = userLoading || isLoadingHeatmap;

  const UserInfoSection = useMemo(() => (
    <View style={styles.userInfoSection}>
      <View style={styles.headerContainer}>
        <View style={styles.streakContainer}>
          <Icon name="fire" size={24} color="#FF6B6B" />
          <Text style={styles.streakText}>{currentStreak}</Text>
          <Caption style={styles.streakCaption}>day{currentStreak !== 1 ? 's' : ''} streak</Caption>
        </View>
        {user?.user_metadata?.name && (
          <Title style={[styles.title, { color: theme.colors.text }]}>{user.user_metadata.name}</Title>
        )}
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel="Open Settings"
        accessibilityRole="button"
        style={styles.settingsButton}
      >
        <Icon name="menu" size={28} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  ), [user?.user_metadata?.name, theme.colors.text, theme.colors.primary, currentStreak, navigation]);

  const onRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const { startDate, endDate } = getDateRange();
      await fetchHeatmapData(startDate, endDate);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, getDateRange, fetchHeatmapData]);

  const ErrorSection = useMemo(() => heatmapError && (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        Error loading nutrition data: {heatmapError}
      </Text>
      <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
        <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  ), [heatmapError, theme.colors.error, theme.colors.primary, onRefresh]);

  const getDateRange = useCallback(() => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }, []);

  // Prefetch data when the app starts
  useFocusEffect(
    useCallback(() => {
      const prefetchData = async () => {
        if (!isDataReady && !isLoadingHeatmap) {
          const { startDate, endDate } = getDateRange();
          const cacheKey = `heatmap_${startDate}_${endDate}`;
          const cachedData = cache.get(cacheKey);

          if (cachedData) {
            // Use cached data immediately
            setIsDataReady(true);
          } else {
            // Fetch fresh data
            await fetchHeatmapData(startDate, endDate);
            setIsDataReady(true);
          }
        }
      };

      prefetchData();
    }, [isDataReady, isLoadingHeatmap, getDateRange, fetchHeatmapData, cache])
  );

  useEffect(() => {
    const initializeData = async () => {
      if (!heatmapData || Object.keys(heatmapData).length === 0) {
        const { startDate, endDate } = getDateRange();
        const cacheKey = `heatmap_${startDate}_${endDate}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
          return;
        }

        try {
          await fetchHeatmapData(startDate, endDate);
        } catch (error) {
          console.error('Error fetching initial data:', error);
        }
      }
    };

    initializeData();
  }, [getDateRange, fetchHeatmapData, heatmapData, cache]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {UserInfoSection}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <Suspense fallback={
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        }>
          {isDataReady && (
            <>
              <View style={styles.section}>
                <NutritionHeatmap data={heatmapData} />
              </View>
              <View style={styles.section}>
                <MacroNutrientsChart data={nutritionalGoals} />
              </View>
            </>
          )}
        </Suspense>
      )}

      {ErrorSection}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  userInfoSection: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#FF6B6B',
  },
  streakCaption: {
    fontSize: 12,
    marginLeft: 4,
    color: '#FF6B6B',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 10,
    marginLeft: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  nutritionSection: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  chartSpacing: {
    height: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 10,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default React.memo(ProfileScreen);

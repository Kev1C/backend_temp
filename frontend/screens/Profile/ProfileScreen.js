// frontend/screens/Profile/ProfileScreen.js

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Image } from 'react-native';
import { Title, Caption, Text } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MacroNutrientsChart from '../../Components/MacroNutrientsChart';
import NutritionHeatmap from '../../Components/NutritionHeatmap';
import useNutritionData from '../../hooks/useNutritionData';

const ProfileScreen = ({ navigation }) => {
  const { user, loading: userLoading } = useAuthStore();
  const theme = useTheme(); // Access the current theme
  const { macroData, calendarData, loading: nutritionLoading, error, refreshData } = useNutritionData();

  const loading = userLoading || nutritionLoading;

  // Memoize the user info section
  const UserInfoSection = useMemo(() => (
    <View style={styles.userInfoSection}>
      <View style={styles.headerContainer}>
        {user.name && (
          <Title style={[styles.title, { color: theme.colors.text }]}>{user.name}</Title>
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
  ), [user.name, theme.colors, navigation]);

  // Memoize the error section
  const ErrorSection = useMemo(() => error && (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        Error loading nutrition data
      </Text>
      <TouchableOpacity onPress={refreshData} style={styles.retryButton}>
        <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  ), [error, theme.colors, refreshData]);

  const onRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // Render item for FlatList
  const renderItem = useCallback(({ item }) => {
    if (item.type === 'heatmap') {
      return (
        <View style={styles.heatmapContainer}>
          <Image 
            source={require('../../assets/images/panda-looking-over.jpg')} 
            style={styles.pandaLogo}
          />
          <NutritionHeatmap data={calendarData} />
        </View>
      );
    } else if (item.type === 'chart') {
      return <MacroNutrientsChart data={macroData} />;
    }
    return null;
  }, [calendarData, macroData]);

  // Memoize data for FlatList
  const listData = useMemo(() => [
    { id: '1', type: 'heatmap' },
    { id: '2', type: 'chart' }
  ], []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return ErrorSection;
  }

  return (
    <FlatList
      data={listData}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      ListHeaderComponent={UserInfoSection}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshing={loading}
      onRefresh={onRefresh}
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={2}
      removeClippedSubviews={true}
    />
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
    flex: 1,
  },
  heatmapContainer: {
    position: 'relative',
    width: '100%',
  },
  pandaLogo: {
    position: 'absolute',
    top: 24,
    left: 20,
    width: 45,
    height: 45,

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
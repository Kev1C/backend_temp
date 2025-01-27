// frontend/Components/RecentlyEaten.js
import React, { memo, useMemo, useCallback } from 'react';
import { View, Image, VirtualizedList, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

const MealItem = memo(({ meal }) => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const nutritionInfo = useMemo(() => (
    <View style={styles.nutritionInfo}>
      <Text style={styles.mealCalories}>{meal.calories} cal</Text>
      <Text style={[styles.macroText, { color: '#8A2BE2' }]}>{meal.carbs}g</Text>
      <Text style={[styles.macroText, { color: theme.colors.secondary }]}>{meal.protein}g</Text>
      <Text style={[styles.macroText, { color: '#FFD700' }]}>{meal.fats}g</Text>
    </View>
  ), [meal.calories, meal.carbs, meal.protein, meal.fats, styles, theme.colors.secondary]);

  const mealImage = useMemo(() => (
    meal.image ? (
      <Image 
        source={{ uri: meal.image }} 
        style={styles.mealImage}
      />
    ) : (
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name="food" 
          size={24} 
          color={theme.colors.primary} 
        />
      </View>
    )
  ), [meal.image, styles.mealImage, styles.iconContainer, theme.colors.primary]);

  return (
    <Card style={styles.mealCard}>
      <Card.Content style={styles.mealContent}>
        {mealImage}
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{meal.name}</Text>
          {nutritionInfo}
        </View>
        <Text style={styles.mealTime}>{meal.time}</Text>
      </Card.Content>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.meal.id === nextProps.meal.id &&
    prevProps.meal.calories === nextProps.meal.calories &&
    prevProps.meal.carbs === nextProps.meal.carbs &&
    prevProps.meal.protein === nextProps.meal.protein &&
    prevProps.meal.fats === nextProps.meal.fats
  );
});

const RecentlyEaten = memo(({ meals = [], isLoading = false }) => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const keyExtractor = useCallback((item) => 
    item.id?.toString() || item._id?.toString() || item.name + item.time
  , []);

  const renderItem = useCallback(({ item }) => {
    return <MealItem meal={item} />;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.emptyText}>Loading meals...</Text>
      </View>
    );
  }

  if (!meals.length) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="food-off" 
          size={24} 
          color={theme.colors.disabled} 
        />
        <Text style={styles.emptyText}>No meals logged for this day</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VirtualizedList
        data={meals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={3}
        removeClippedSubviews={true}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Deep comparison of meals array
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.meals.length !== nextProps.meals.length) return false;
  
  // Compare only the last meal (most recently added)
  const prevLastMeal = prevProps.meals[prevProps.meals.length - 1];
  const nextLastMeal = nextProps.meals[nextProps.meals.length - 1];
  
  if (!prevLastMeal || !nextLastMeal) return false;
  
  return (
    prevLastMeal.id === nextLastMeal.id &&
    prevLastMeal.calories === nextLastMeal.calories &&
    prevLastMeal.carbs === nextLastMeal.carbs &&
    prevLastMeal.protein === nextLastMeal.protein &&
    prevLastMeal.fats === nextLastMeal.fats
  );
});

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 400,
    paddingTop: 120,
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  mealCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    height: 84,
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nutritionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  mealCalories: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  macroText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mealTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    marginTop: 8,
    color: theme.colors.text,
    opacity: 0.6,
  },
});

export default RecentlyEaten;
// frontend/Components/RecentlyEaten.js
import React, { memo } from 'react';
import { View, Image, VirtualizedList, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

const MealItem = memo(({ meal }) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <Card style={styles.mealCard}>
      <Card.Content style={styles.mealContent}>
        {meal.image ? (
          <Image source={{ uri: meal.image }} style={styles.mealImage} />
        ) : (
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name="food" 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
        )}
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <View style={styles.nutritionInfo}>
            <Text style={styles.mealCalories}>{meal.calories} cal</Text>
            <Text style={[styles.macroText, { color: '#8A2BE2' }]}>{meal.carbs}g</Text>
            <Text style={[styles.macroText, { color: theme.colors.secondary }]}>{meal.protein}g</Text>
            <Text style={[styles.macroText, { color: '#FFD700' }]}>{meal.fats}g</Text>
          </View>
        </View>
        <Text style={styles.mealTime}>{meal.time}</Text>
      </Card.Content>
    </Card>
  );
});

const RecentlyEaten = ({ meals = [], isLoading = false }) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const windowHeight = Dimensions.get('window').height;

  const getItem = (data, index) => data[index];
  const getItemCount = (data) => data.length;
  const keyExtractor = (item, index) => item.id?.toString() || item._id?.toString() || index.toString();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.emptyText}>Loading meals...</Text>
      </View>
    );
  }

  if (meals.length === 0) {
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
        renderItem={({ item }) => <MealItem meal={item} />}
        keyExtractor={keyExtractor}
        getItemCount={getItemCount}
        getItem={getItem}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        getItemLayout={(data, index) => ({
          length: 90,
          offset: 90 * index,
          index,
        })}
      />
    </View>
  );
};

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
    fontSize: 16,
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
    color: theme.colors.text,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 8,
    color: theme.colors.text,
    opacity: 0.6,
  },
});

export default memo(RecentlyEaten);
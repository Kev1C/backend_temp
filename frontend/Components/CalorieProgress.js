//frontend/Components/CalorieProgress.js
import React, { useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const calculatePercentage = (value, total) => {
  return total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
};

const MacroCard = React.memo(({ label, value = 0, total = 0, color }) => {
  const percentage = useMemo(() => calculatePercentage(value, total), [value, total]);
  const left = useMemo(() => Math.max(0, total - value), [total, value]);

  const renderPercentage = useCallback((fill) => (
    <Text style={{ color: '#333', fontWeight: 'bold' }}>
      {Math.round(fill)}%
    </Text>
  ), []);

  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>
      <AnimatedCircularProgress
        size={60}
        width={8}
        fill={percentage}
        duration={300}
        tintColor={color}
        backgroundColor={`${color}26`}
        rotation={0}
      >
        {renderPercentage}
      </AnimatedCircularProgress>
      <View style={styles.macroValues}>
        <Text style={styles.macroValue}>{value}g / {total}g</Text>
        <Text style={styles.macroLeft}>{left}g left</Text>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for MacroCard
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.total === nextProps.total &&
    prevProps.color === nextProps.color
  );
});

const CalorieProgress = React.memo(({ nutrients }) => {
  const theme = useTheme();
  
  const { current, goals } = useMemo(() => ({
    current: nutrients?.current || {},
    goals: nutrients?.goals || {}
  }), [nutrients]);
  
  const {
    calories = 0,
    carbs = 0,
    protein = 0,
    fats = 0
  } = current;
  
  const {
    calories: caloriesGoal = 2000,
    carbs: carbsGoal = 0,
    protein: proteinGoal = 0,
    fats: fatsGoal = 0
  } = goals;
  
  const caloriePercentage = useMemo(() => 
    calculatePercentage(calories, caloriesGoal),
    [calories, caloriesGoal]
  );
  
  const caloriesLeft = useMemo(() => 
    Math.max(0, caloriesGoal - calories),
    [calories, caloriesGoal]
  );

  const renderCaloriePercentage = useCallback((fill) => (
    <Text style={styles.caloriePercentage}>
      {Math.round(fill)}%
    </Text>
  ), []);

  const macroCards = useMemo(() => ([

    {
      label: 'Carbs',
      value: carbs,
      total: carbsGoal,
      color: '#8A2BE2'
    },
    {
      label: 'Protein',
      value: protein,
      total: proteinGoal,
      color: theme.colors.secondary
    },
    {
      label: 'Fats',
      value: fats,
      total: fatsGoal,
      color: '#FFA500'
    }
  ]), [carbs, carbsGoal, protein, proteinGoal, fats, fatsGoal, theme.colors.secondary]);

  const renderMacroCard = useCallback((cardData) => (
    <MacroCard
      key={cardData.label}
      {...cardData}
    />
  ), []);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainCard}>
        <View style={styles.mainCardContent}>
          <View style={styles.caloriesLeftContainer}>
            <Text style={styles.caloriesLeftNumber}>{caloriesLeft}</Text>
            <Text style={styles.caloriesLeftText}>calories left</Text>
            <Text style={styles.totalValue}>{calories} / {caloriesGoal} kcal</Text>
          </View>
          <AnimatedCircularProgress
            size={120}
            width={12}
            fill={caloriePercentage}
            duration={300}
            tintColor={theme.colors.primary}
            backgroundColor={`${theme.colors.primary}26`}
            rotation={0}
          >
            {renderCaloriePercentage}
          </AnimatedCircularProgress>
        </View>
        <View style={styles.macroContainer}>
          {macroCards.map(renderMacroCard)}
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Deep comparison of nutrients
  const prevCurrent = prevProps.nutrients?.current || {};
  const nextCurrent = nextProps.nutrients?.current || {};
  const prevGoals = prevProps.nutrients?.goals || {};
  const nextGoals = nextProps.nutrients?.goals || {};
  
  return (
    prevCurrent.calories === nextCurrent.calories &&
    prevCurrent.carbs === nextCurrent.carbs &&
    prevCurrent.protein === nextCurrent.protein &&
    prevCurrent.fats === nextCurrent.fats &&
    prevGoals.calories === nextGoals.calories &&
    prevGoals.carbs === nextGoals.carbs &&
    prevGoals.protein === nextGoals.protein &&
    prevGoals.fats === nextGoals.fats
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 8,
    marginVertical: 8,
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 32,
  },
  caloriesLeftContainer: {
    flex: 1,
    marginRight: 24,
    alignItems: 'flex-start',
  },
  caloriesLeftNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  caloriesLeftText: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  macroCard: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  macroValues: {
    alignItems: 'center',
    marginTop: 8,
  },
  macroValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  macroLeft: {
    fontSize: 12,
    color: '#999',
  },
  calorieTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriePercentage: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  caloriesLeft: {
    fontSize: 14,
    color: '#666',
  },
});

export default CalorieProgress;

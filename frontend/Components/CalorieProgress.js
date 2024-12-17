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
        {() => (
          <Text style={{ color: '#333', fontWeight: 'bold' }}>
            {Math.round(percentage)}%
          </Text>
        )}
      </AnimatedCircularProgress>
      <View style={styles.macroValues}>
        <Text style={styles.macroValue}>{value}g / {total}g</Text>
        <Text style={styles.macroLeft}>{left}g left</Text>
      </View>
    </View>
  );
});

const CalorieProgress = React.memo(({ nutrients }) => {
  const theme = useTheme();
  
  // Ensure we have valid data
  const current = nutrients?.current || {};
  const goals = nutrients?.goals || {};
  
  const {
    calories = 0,
    carbs = 0,
    protein = 0,
    fat = 0
  } = current;
  
  const {
    calories: caloriesGoal = 2000,
    carbs: carbsGoal = 0,
    protein: proteinGoal = 0,
    fat: fatGoal = 0
  } = goals;
  
  // Calculate calorie percentage
  const caloriePercentage = useMemo(() => 
    calculatePercentage(calories, caloriesGoal),
    [calories, caloriesGoal]
  );
  
  // Calculate calories left
  const caloriesLeft = useMemo(() => 
    Math.max(0, caloriesGoal - calories),
    [calories, caloriesGoal]
  );

  const renderMacroCard = useCallback((label, value, total, color) => (
    <MacroCard
      key={label}
      label={label}
      value={value}
      total={total}
      color={color}
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
            {() => (
              <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 18 }}>
                {Math.round(caloriePercentage)}%
              </Text>
            )}
          </AnimatedCircularProgress>
        </View>
        <View style={styles.macroContainer}>
          {renderMacroCard("Carbs", carbs, carbsGoal, "#8A2BE2")}
          {renderMacroCard("Protein", protein, proteinGoal, theme.colors.secondary)}
          {renderMacroCard("Fat", fat, fatGoal, "#FFD700")}
        </View>
      </View>
    </View>
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
});

export default CalorieProgress;

//frontned/Components/NutritionHeatmap.js
import React, { useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from 'react-native-paper';
import { useNutritionStore } from '../stores/nutritionStore';

const NutritionHeatmap = React.memo(({ data, onPress }) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { nutritionalGoals } = useNutritionStore();
  const dailyGoal = nutritionalGoals.calories || 2000;
  const colorCache = useRef(new Map());

  // Memoize the color calculation function with cache
  const getColor = useCallback((value, goal) => {
    if (value === undefined || value === null) return 'transparent'; // No data recorded
    if (value === 0) return theme.colors.disabled; // Data recorded but zero value
    const key = `${value}-${goal}`;
    if (colorCache.current.has(key)) {
      return colorCache.current.get(key);
    }
    const intensity = Math.min(value / goal, 1); // Calculate intensity based on daily goal
    const color = intensity >= 1 
      ? 'rgba(52, 168, 83, 1)' // Full green for meeting/exceeding goal
      : `rgba(${Math.round(255 * (1 - intensity))}, ${Math.round(168 * intensity)}, 83, ${0.3 + (intensity * 0.7)})`;
    
    colorCache.current.set(key, color);
    return color;
  }, [theme.colors.disabled]);

  // Process data for the calendar with optimized calculations
  const markedDates = useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return {};
    }

    const result = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process all dates at once for better performance
    Object.entries(data).forEach(([date, { value, goalMet }]) => {
      const color = getColor(value, dailyGoal);
      const dateObj = new Date(date);
      const isPast = dateObj <= today;

      result[date] = {
        selected: true,
        selectedColor: color,
        marked: goalMet,
        dotColor: goalMet ? theme.colors.primary : theme.colors.disabled,
        customStyles: {
          container: {
            backgroundColor: isPast ? color : theme.colors.disabled,
            borderRadius: 20,
            width: 35,
            height: 35,
          },
          text: {
            color: goalMet ? theme.colors.primary : theme.colors.text,
          }
        }
      };
    });

    return result;
  }, [data, getColor, theme.colors, dailyGoal]);

  return (
    <View style={[styles.container]}>
      <Calendar
        markingType={'custom'}
        markedDates={markedDates}
        onDayPress={onPress}
        theme={{
          calendarBackground: 'transparent',
          dayTextColor: theme.colors.text,
          monthTextColor: theme.colors.primary,
          textDisabledColor: theme.colors.disabled,
          selectedDayTextColor: theme.colors.text,
          todayTextColor: theme.colors.primary,
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: -20,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16
  }
});

export default NutritionHeatmap;

import React, { useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from 'react-native-paper';

const NutritionHeatmap = React.memo(({ data }) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const colorCache = useRef(new Map());

  // Memoize the color calculation function with cache
  const getColor = useCallback((value, maxValue) => {
    const key = `${value}-${maxValue}`;
    if (colorCache.current.has(key)) {
      return colorCache.current.get(key);
    }
    const intensity = value / maxValue;
    const color = `rgba(52, 168, 83, ${0.2 + (intensity * 0.8)})`;
    colorCache.current.set(key, color);
    return color;
  }, []);

  // Process data for the calendar with optimized calculations
  const markedDates = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return {};

    const maxValue = Math.max(...Object.values(data).map(d => d.value));
    const result = {};

    // Process all dates at once for better performance
    Object.entries(data).forEach(([date, { value }]) => {
      const color = getColor(value, maxValue);
      const intensity = value / maxValue;

      result[date] = {
        customStyles: {
          container: {
            backgroundColor: color,
            borderRadius: 20,
            width: 35,
            height: 35,
            alignItems: 'center',
            justifyContent: 'center',
            margin: 2
          },
          text: {
            color: intensity > 0.5 ? 'white' : theme.colors.text,
            textAlign: 'center'
          },
        },
      };
    });

    return result;
  }, [data, theme.colors.text, getColor]);

  // Memoize theme-dependent styles
  const calendarTheme = useMemo(() => ({
    calendarBackground: theme.colors.surface,
    textSectionTitleColor: theme.colors.text,
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: '#ffffff',
    todayTextColor: theme.colors.primary,
    dayTextColor: theme.colors.text,
    textDisabledColor: theme.colors.disabled,
    monthTextColor: theme.colors.text,
    arrowColor: theme.colors.primary,
  }), [theme.colors]);

  const containerWidth = width - 32;

  return (
    <View style={[styles.container, { width: containerWidth }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Nutrition Calendar</Text>
      <Calendar
        style={[styles.calendar, { width: '100%' }]}
        theme={calendarTheme}
        markingType={'custom'}
        markedDates={markedDates}
        current={new Date().toISOString().split('T')[0]}
        enableSwipeMonths={true}
        displayLoadingIndicator={false}
      />
    </View>
  );
});

NutritionHeatmap.displayName = 'NutritionHeatmap';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  calendar: {
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default NutritionHeatmap;

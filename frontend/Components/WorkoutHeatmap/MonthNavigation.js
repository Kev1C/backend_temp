// frontend/Components/WorkoutHeatmap/MonthNavigation.js

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import styles from './WorkoutHeatmap.styles';

const MonthNavigation = ({ currentMonth, changeMonth, theme }) => (
  <View style={styles.monthNavigation}>
    <TouchableOpacity
      onPress={() => changeMonth('prev')}
      accessibilityLabel="Navigate to previous month"
      accessibilityRole="button"
    >
      <Text style={[styles.navButton, { color: theme.colors.primary }]}>←</Text>
    </TouchableOpacity>
    <Text style={[styles.monthLabel, { color: theme.colors.text }]}>
      {currentMonth.format('MMMM YYYY')}
    </Text>
    <TouchableOpacity
      onPress={() => changeMonth('next')}
      accessibilityLabel="Navigate to next month"
      accessibilityRole="button"
    >
      <Text style={[styles.navButton, { color: theme.colors.primary }]}>→</Text>
    </TouchableOpacity>
  </View>
);

export default MonthNavigation;
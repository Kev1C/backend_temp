// WorkoutHeatmap.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ActivityIndicator, Dimensions, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import moment from 'moment';
import PropTypes from 'prop-types';

import { useAuthStore } from '../../stores/authStore';
import { useWorkoutData } from './useWorkoutData';
import { getCategoryColor } from './colorUtils';
import styles from './WorkoutHeatmap.styles';

import MonthNavigation from './MonthNavigation';
import CategoryToggle from './CategoryToggle';
import MuscleGroupPicker from './MuscleGroupPicker';
import Heatmap from './Heatmap';
import Tooltip from './Tooltip';

const CELL_MARGIN = 4;
const NUM_COLUMNS = 7;
const SCREEN_PADDING = 40;

const WORKOUT_CATEGORIES = [
  { key: 'Cardio', label: 'Cardio', color: '#5CB1F6' },
  { key: 'StrengthTraining', label: 'Strength Training', color: '#6EE7B7' },
  { key: 'Flexibility', label: 'Flexibility', color: '#A569BD' },
];

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Shoulders', 'Back', 'Arms', 'Legs', 'Quads',
  'Hamstrings', 'Calves', 'Glutes', 'Abs', 'Obliques', 'Lower Back',
];

const WorkoutHeatmap = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [selectedCategories, setSelectedCategories] = useState(
    WORKOUT_CATEGORIES.map(category => category.key)
  );
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [dateMatrix, setDateMatrix] = useState([]);
  const [tooltipData, setTooltipData] = useState(null);

  const { width } = Dimensions.get('window');
  const CELL_SIZE = useMemo(
    () => (width - SCREEN_PADDING - (NUM_COLUMNS - 1) * CELL_MARGIN) / NUM_COLUMNS,
    [width]
  );

  const { workoutData, loading, error } = useWorkoutData(user, currentMonth, selectedCategories, selectedMuscleGroup);

  useEffect(() => {
    const generateDateMatrix = () => {
      const startOfMonth = currentMonth.clone().startOf('month').startOf('week');
      const endOfMonth = currentMonth.clone().endOf('month').endOf('week');
      const matrix = [];
      let currentDate = startOfMonth.clone();

      while (currentDate.isBefore(endOfMonth)) {
        const week = [];
        for (let i = 0; i < NUM_COLUMNS; i++) {
          week.push(currentDate.clone());
          currentDate.add(1, 'day');
        }
        matrix.push(week);
      }
      setDateMatrix(matrix);
    };

    generateDateMatrix();
  }, [currentMonth]);

  const toggleCategorySelection = useCallback((categoryKey) => {
    setSelectedCategories(prevCategories =>
      prevCategories.includes(categoryKey)
        ? prevCategories.filter(cat => cat !== categoryKey)
        : [...prevCategories, categoryKey]
    );
  }, []);

  const navigateMonth = useCallback((direction) => {
    setCurrentMonth(prevMonth =>
      direction === 'prev'
        ? prevMonth.clone().subtract(1, 'month')
        : prevMonth.clone().add(1, 'month')
    );
  }, []);

  const filterDataByMuscleGroup = useCallback(
    (categoryKey, dateStr) => {
      if (selectedMuscleGroup === 'All') return true;
      if (categoryKey !== 'StrengthTraining') return true;
      return workoutData[categoryKey]?.[dateStr]?.muscleGroup === selectedMuscleGroup;
    },
    [selectedMuscleGroup, workoutData]
  );

  const getAggregatedData = useCallback((date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return selectedCategories.reduce((acc, categoryKey) => {
      if (
        workoutData[categoryKey]?.[dateStr] &&
        filterDataByMuscleGroup(categoryKey, dateStr)
      ) {
        acc.push({ category: categoryKey, data: workoutData[categoryKey][dateStr] });
      }
      return acc;
    }, []);
  }, [selectedCategories, workoutData, filterDataByMuscleGroup]);

  const getColorForDate = useCallback((date, categoryKey) => {
    const dateStr = date.format('YYYY-MM-DD');
    const data = workoutData[categoryKey]?.[dateStr];

    if (!data) return theme.colors.disabled;

    const value = categoryKey === 'StrengthTraining' ? data.volume : data.duration;
    return getCategoryColor(categoryKey, value, theme);
  }, [workoutData, theme]);

  const getCategoryPriority = useCallback((aggregatedData) => {
    const priority = ['Cardio', 'StrengthTraining', 'Flexibility'];
    return priority.find(category => aggregatedData.some(item => item.category === category));
  }, []);

  const determineFillColor = useCallback((date, aggregatedData) => {
    const priorityCategory = getCategoryPriority(aggregatedData);
    return priorityCategory ? getColorForDate(date, priorityCategory) : theme.colors.disabled;
  }, [getCategoryPriority, getColorForDate, theme.colors.disabled]);

  const isPR = useCallback((dateStr) => {
    return WORKOUT_CATEGORIES.some(
      category =>
        selectedCategories.includes(category.key) &&
        workoutData[category.key]?.[dateStr]?.PR
    );
  }, [selectedCategories, workoutData]);

  const handleDatePress = useCallback((date) => {
    const data = getAggregatedData(date);
    if (data.length) {
      setTooltipData({
        date: date.format('MMMM Do YYYY'),
        data,
      });
    }
  }, [getAggregatedData]);

  const getMetricsText = useCallback((entry) => {
    const { category, data } = entry;
    switch (category) {
      case 'Cardio':
        return `Duration: ${data.duration}m, Calories: ${data.calories}`;
      case 'StrengthTraining':
        return `Volume: ${data.volume}, Reps: ${data.reps}, Sets: ${data.sets}, Weight: ${data.weight}kg, Calories: ${data.calories}`;
      case 'Flexibility':
        return `Duration: ${data.duration}m, Calories: ${data.calories}`;
      default:
        return '';
    }
  }, []);

  const MemoizedMonthNavigation = useMemo(() => React.memo(MonthNavigation), []);
  const MemoizedCategoryToggle = useMemo(() => React.memo(CategoryToggle), []);
  const MemoizedMuscleGroupPicker = useMemo(() => React.memo(MuscleGroupPicker), []);
  const MemoizedHeatmap = useMemo(() => React.memo(Heatmap), []);

  return (
    <View style={styles.container}>
      <MemoizedMonthNavigation
        currentMonth={currentMonth}
        changeMonth={navigateMonth}
        theme={theme}
      />

      <MemoizedCategoryToggle
        categories={WORKOUT_CATEGORIES}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategorySelection}
        theme={theme}
      />

      {selectedCategories.includes('StrengthTraining') && (
        <MemoizedMuscleGroupPicker
          selectedMuscleGroup={selectedMuscleGroup}
          setSelectedMuscleGroup={setSelectedMuscleGroup}
          muscleGroups={MUSCLE_GROUPS}
          theme={theme}
        />
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loadingIndicator}
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          {Object.keys(workoutData).length === 0 && (
            <Text style={styles.noDataText}>
              No workout data available for {currentMonth.format('MMMM YYYY')}.
            </Text>
          )}

          <MemoizedHeatmap
            dateMatrix={dateMatrix}
            currentMonth={currentMonth}
            determineFillColor={(date) => determineFillColor(date, getAggregatedData(date))}
            isPR={isPR}
            handleDatePress={handleDatePress}
            CELL_SIZE={CELL_SIZE}
            CELL_MARGIN={CELL_MARGIN}
            width={width - SCREEN_PADDING}
            theme={theme}
          />
        </>
      )}

      <Tooltip
        visible={tooltipData !== null}
        tooltipData={tooltipData}
        onClose={() => setTooltipData(null)}
        getCategoryColor={getCategoryColor}
        getMetricsText={getMetricsText}
        theme={theme}
      />
    </View>
  );
};

WorkoutHeatmap.propTypes = {
  // Add any props if needed in the future
};

export default WorkoutHeatmap;
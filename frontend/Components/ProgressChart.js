import React, { useEffect, useState, useCallback, useRef, useMemo, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, ActivityIndicator, Text } from 'react-native';
import { VictoryChart, VictoryArea, VictoryAxis, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { useTheme } from 'react-native-paper';
import { H3 } from './Typography';
import { api } from '../services/api';
import debounce from 'lodash/debounce';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DATA_WINDOW_SIZE = 30; // Number of data points to show at once
const DEBOUNCE_DELAY = 500; // ms

// Memoize chart styles
const getChartStyles = (colors) => ({
  axis: { stroke: colors.text, strokeWidth: 1 },
  tickLabels: { 
    fill: colors.text,
    angle: -45,
    fontSize: 10,
    textAnchor: 'end',
    padding: 8
  },
  grid: { stroke: colors.text, opacity: 0.1, strokeDasharray: '4' }
});

// Define styles outside the component
const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 16,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 350,
  },
  chartTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    minHeight: 300,
  },
  errorText: {
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  placeholderText: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 16,
  },
  placeholderIcon: {
    marginBottom: 16,
    opacity: 0.4,
  }
});

const ProgressChart = React.forwardRef(({ token, selectedCategories }, ref) => {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const isMounted = useRef(true);

  // Memoize styles
  const chartStyles = useMemo(() => getChartStyles(theme.colors), [theme.colors]);
  const containerStyle = useMemo(() => ([
    styles.chartContainer, 
    { backgroundColor: theme.colors.card }
  ]), [theme.colors.card]);
  const titleStyle = useMemo(() => ([
    styles.chartTitle, 
    { color: theme.colors.text }
  ]), [theme.colors.text]);
  const errorTextStyle = useMemo(() => ([
    styles.errorText,
    { color: theme.colors.error }
  ]), [theme.colors.error]);

  // Memoize chart dimensions and padding
  const chartConfig = useMemo(() => ({
    width: screenWidth - 32,
    height: 300,
    padding: { top: 20, bottom: 50, left: 60, right: 60 },
    domainPadding: { x: [20, 20], y: [10, 10] }
  }), [screenWidth]);

  // Memoize date formatter
  const dateFormatter = useCallback((date) => {
    const d = new Date(date);
    return Platform.OS === 'ios' ? 
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
      `${d.getMonth() + 1}/${d.getDate()}`;
  }, []);

  // Memoize data transformation
  const transformData = useCallback((data, type) => {
    if (!data || data.length === 0) return [];
    
    const metricMap = {
      Weight: { key: 'weight', unit: 'kg' },
      MuscleMass: { key: 'muscleMass', unit: 'kg' },
      BodyFat: { key: 'fatPercentage', unit: '%' }
    };

    const { key, unit } = metricMap[type];
    return data.map(entry => ({
      x: new Date(entry.date).getTime(),
      y: entry[key],
      metric: type.replace(/([A-Z])/g, ' $1').trim(),
      value: entry[key],
      unit
    }));
  }, []);

  // Memoize the filtered data
  const validProgressData = useMemo(() => {
    return progressData.filter(entry => {
      if (!entry || !entry.date) return false;
      
      // Only validate fields that are selected
      const validations = {
        Weight: () => typeof entry.weight === 'number',
        MuscleMass: () => typeof entry.muscleMass === 'number',
        BodyFat: () => typeof entry.fatPercentage === 'number'
      };

      // Check if at least one selected category has valid data
      return selectedCategories.some(category => 
        validations[category] ? validations[category]() : false
      );
    }).sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-DATA_WINDOW_SIZE);
  }, [progressData, selectedCategories]);

  // Calculate domains based on selected categories and values
  const calculateYDomain = useCallback((weightVals, muscleVals, fatVals, categories) => {
    if (categories.includes('Weight') && weightVals.length) {
      return [
        Math.max(0, Math.min(...weightVals) * 0.95),
        Math.max(...weightVals) * 1.05
      ];
    }
    if (categories.includes('MuscleMass') && muscleVals.length) {
      return [
        Math.max(0, Math.min(...muscleVals) * 0.95),
        Math.max(...muscleVals) * 1.05
      ];
    }
    if (fatVals.length) {
      return [
        Math.max(0, Math.min(...fatVals) * 0.95),
        Math.max(...fatVals) * 1.05
      ];
    }
    return [0, 100];
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!token || !isMounted.current) return;

      try {
        setLoading(true);
        setError(null);

        // Cancel any in-flight requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const response = await api.get('/progress', {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortControllerRef.current.signal
        });

        if (isMounted.current) {
          setProgressData(response.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted.current && !err.name === 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchProgress();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [token]);

  // Expose refresh method through ref
  React.useImperativeHandle(ref, () => ({
    refresh: async () => {
      if (!token || !isMounted.current) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/progress', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted.current) {
          setProgressData(response.data);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }
  }), [token]);

  const renderChart = useCallback(() => {
    if (!validProgressData || validProgressData.length === 0 || selectedCategories.length === 0) {
      return (
        <View style={[containerStyle, styles.placeholderContainer]}>
          <Icon 
            name="chart-line" 
            size={48} 
            color={theme.colors.text} 
            style={styles.placeholderIcon}
          />
          <Text style={[styles.placeholderText, { color: theme.colors.text }]}>
            {validProgressData.length === 0 ? "No data available for selected categories" : "Select categories above to view your progress"}
          </Text>
        </View>
      );
    }

    const lines = [];
    const weightValues = [];
    const muscleValues = [];
    const fatValues = [];

    // Prepare data for each category
    if (selectedCategories.includes('Weight')) {
      const weightData = transformData(validProgressData, 'Weight');
      lines.push(
        <VictoryArea
          key="weight"
          data={weightData}
          style={{
            data: { 
              fill: '#5CB1F6',
              fillOpacity: 0.3,
              stroke: '#5CB1F6', 
              strokeWidth: 2 
            }
          }}
          animate={{
            duration: 200,
            onLoad: { duration: 200 }
          }}
        />
      );
      weightValues.push(...weightData.map(d => d.y));
    }

    if (selectedCategories.includes('MuscleMass')) {
      const muscleData = transformData(validProgressData, 'MuscleMass');
      lines.push(
        <VictoryArea
          key="muscleMass"
          data={muscleData}
          style={{
            data: { 
              fill: '#6EE7B7',
              fillOpacity: 0.3,
              stroke: '#6EE7B7', 
              strokeWidth: 2 
            }
          }}
          animate={{
            duration: 200,
            onLoad: { duration: 200 }
          }}
        />
      );
      muscleValues.push(...muscleData.map(d => d.y));
    }

    if (selectedCategories.includes('BodyFat')) {
      const fatData = transformData(validProgressData, 'BodyFat');
      lines.push(
        <VictoryArea
          key="bodyFat"
          data={fatData}
          style={{
            data: { 
              fill: '#A569BD',
              fillOpacity: 0.3,
              stroke: '#A569BD', 
              strokeWidth: 2 
            }
          }}
          animate={{
            duration: 200,
            onLoad: { duration: 200 }
          }}
        />
      );
      fatValues.push(...fatData.map(d => d.y));
    }

    if (lines.length === 0) return null;

    const yDomain = calculateYDomain(weightValues, muscleValues, fatValues, selectedCategories);

    return (
      <View style={containerStyle}>
        <H3 style={titleStyle}>Progress Tracking</H3>
        <VictoryChart
          {...chartConfig}
          scale={{ x: "time" }}
          domain={{ y: yDomain }}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) => `${datum.metric}: ${datum.value}${datum.unit}`}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{
                    fill: theme.colors.card,
                    stroke: theme.colors.primary,
                  }}
                  style={{ 
                    fill: theme.colors.text,
                    fontSize: 12,
                    padding: 8
                  }}
                  flyoutWidth={150}
                  flyoutHeight={40}
                  cornerRadius={5}
                  pointerLength={8}
                  constrainToVisibleArea
                  dy={-60}
                  dx={0}
                  orientation="top"
                  centerOffset={{ x: 0, y: 40 }}
                />
              }
            />
          }
        >
          <VictoryAxis
            scale="time"
            tickFormat={dateFormatter}
            style={chartStyles}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(y) => `${Math.round(y * 10) / 10}`}
            style={chartStyles}
          />
          {lines}
        </VictoryChart>
      </View>
    );
  }, [validProgressData, selectedCategories, chartStyles, containerStyle, titleStyle, chartConfig, dateFormatter, transformData, calculateYDomain]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <H3 style={errorTextStyle}>Error loading progress data</H3>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderChart()}
    </View>
  );
});

export default ProgressChart;

//frontend/Components/MacroNutrientsChart.js
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryGroup, VictoryLegend, VictoryLabel } from 'victory-native';
import { useTheme } from 'react-native-paper';
import { useNutritionStore } from '../stores/nutritionStore';

const MacroNutrientsChart = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [currentMonthData, setCurrentMonthData] = useState(null);
  const [lastMonthData, setLastMonthData] = useState(null);
  const { getMonthlyNutrition } = useNutritionStore();

  // Memoize colors
  const colors = useMemo(() => ({
    lastMonth: '#CCCCCC',  // Grey color for last month
    calories: theme.colors.primary,
    carbs: '#8A2BE2',      // BlueViolet for carbs
    protein: theme.colors.secondary,
    fats: '#FFA500'        // Gold for fats
  }), [theme.colors]);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Calculate last month
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      try {
        const [currentData, lastData] = await Promise.all([
          getMonthlyNutrition(currentYear, currentMonth),
          getMonthlyNutrition(lastYear, lastMonth)
        ]);

        setCurrentMonthData(currentData || {});
        setLastMonthData(lastData || {});
      } catch (error) {
        console.error('Error fetching monthly nutrition data:', error);
        setCurrentMonthData({});
        setLastMonthData({});
      }
    };

    fetchData();
  }, [getMonthlyNutrition]);

  const chartData = useMemo(() => {
    const metrics = [
      { key: 'averageCalories', label: 'Calories', unit: 'kcal', color: colors.calories },
      { key: 'averageCarbs', label: 'Carbs', unit: 'g', color: colors.carbs },
      { key: 'averageProtein', label: 'Protein', unit: 'g', color: colors.protein },
      { key: 'averageFats', label: 'Fats', unit: 'g', color: colors.fats }
    ];
    
    const defaultData = {
      averageCalories: 0,
      averageCarbs: 0,
      averageProtein: 0,
      averageFats: 0
    };

    const current = currentMonthData || defaultData;
    const last = lastMonthData || defaultData;
    
    return {
      current: metrics.map(({ key, label, unit, color }) => ({
        x: label,
        y: Math.round(current[key] || 0),
        label: `${Math.round(current[key] || 0)}${unit}`,
        color
      })),
      last: metrics.map(({ key, label, unit }) => ({
        x: label,
        y: Math.round(last[key] || 0),
        label: `${Math.round(last[key] || 0)}${unit}`,
        color: colors.lastMonth
      }))
    };
  }, [currentMonthData, lastMonthData, colors]);

  if (!chartData.current.length && !chartData.last.length) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Monthly Average Macros</Text>
      <VictoryChart
        width={width - 32}
        height={300}
        domainPadding={{ x: 40 }}
        padding={{ top: 40, bottom: 50, left: 50, right: 10 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: theme.colors.text },
            tickLabels: { 
              fill: theme.colors.text,
              fontSize: 10,
              padding: 5
            }
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: theme.colors.text },
            tickLabels: { 
              fill: theme.colors.text,
              fontSize: 10
            },
            grid: { stroke: theme.colors.text, opacity: 0.1 }
          }}
        />
        <VictoryGroup offset={22}>
          <VictoryBar
            barWidth={20}
            data={chartData.last}
            style={{ 
              data: { 
                fill: colors.lastMonth,
                width: 15
              },
              labels: {
                fill: theme.colors.text,
                fontSize: 10
              }
            }}
            labelComponent={
              <VictoryLabel
                dy={-10}
                textAnchor="middle"
              />
            }
          />
          <VictoryBar
            barWidth={20}
            data={chartData.current}
            style={{ 
              data: { 
                fill: ({ datum }) => datum.color,
                width: 15
              },
              labels: {
                fill: theme.colors.text,
                fontSize: 10
              }
            }}
            labelComponent={
              <VictoryLabel
                dy={-10}
                textAnchor="middle"
              />
            }
          />
        </VictoryGroup>
        <VictoryLegend
          x={width - 220}
          y={10}
          orientation="horizontal"
          gutter={20}
          symbolSpacer={5}
          itemsPerRow={2}
          style={{
            labels: { fill: theme.colors.text, fontSize: 10 },
            parent: { paddingRight: 10 }
          }}
          data={[
            { name: 'Last Month', symbol: { fill: colors.lastMonth } },
            { name: 'This Month', symbol: { fill: theme.colors.primary } }
          ]}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'transparent',
    alignItems: 'center'  // Center the chart horizontally
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  }
});

export default React.memo(MacroNutrientsChart);

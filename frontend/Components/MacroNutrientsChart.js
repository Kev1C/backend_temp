import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryStack, VictoryLegend, VictoryTooltip, VictoryContainer, VictoryVoronoiContainer } from 'victory-native';
import { useTheme } from 'react-native-paper';
import PropTypes from 'prop-types';

const MacroNutrientsChart = React.memo(({ data }) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // Memoize color functions
  const colors = useMemo(() => ({
    protein: theme.colors.secondary,
    carbs: '#8A2BE2',
    fat: '#FFD700'
  }), [theme.colors.secondary]);

  // Default data if none provided
  const defaultData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [30, 35, 28, 32, 29, 25, 30],
        color: colors.protein,
        name: 'Protein'
      },
      {
        data: [45, 50, 42, 48, 44, 40, 45],
        color: colors.carbs,
        name: 'Carbs'
      },
      {
        data: [25, 15, 30, 20, 27, 35, 25],
        color: colors.fat,
        name: 'Fat'
      },
    ]
  };

  const chartData = useMemo(() => {
    const sourceData = data || defaultData;
    return sourceData.datasets.map(dataset => 
      sourceData.labels.map((label, index) => ({
        x: label,
        y: dataset.data[index],
        color: dataset.color,
        name: dataset.name
      }))
    );
  }, [data, defaultData]);

  const legendData = useMemo(() => 
    (data || defaultData).datasets.map(dataset => ({
      name: dataset.name,
      symbol: { fill: dataset.color }
    })), [data, defaultData]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Macro Nutrients</Text>
      <VictoryChart
        width={width - 32}
        height={300}
        domainPadding={{ x: 25 }}
        padding={{ top: 20, bottom: 50, left: 50, right: 50 }}
        containerComponent={
          <VictoryVoronoiContainer
            labels={({ datum }) => `${datum.name}: ${datum.y}g`}
            labelComponent={
              <VictoryTooltip
                style={{ fill: theme.colors.text }}
                flyoutStyle={{ 
                  fill: theme.colors.surface,
                  stroke: theme.colors.primary
                }}
                flyoutPadding={8}
                cornerRadius={5}
                dy={-10}
              />
            }
          />
        }
      >
        <VictoryAxis
          tickFormat={(t) => t}
          style={{
            axis: { stroke: theme.colors.text },
            tickLabels: { 
              fill: theme.colors.text,
              fontSize: 10
            }
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t}g`}
          style={{
            axis: { stroke: theme.colors.text },
            tickLabels: { 
              fill: theme.colors.text,
              fontSize: 10
            }
          }}
        />
        <VictoryStack>
          {chartData.map((dataset, index) => (
            <VictoryBar
              key={index}
              data={dataset}
              style={{
                data: {
                  fill: ({ datum }) => datum.color
                }
              }}
            />
          ))}
        </VictoryStack>
      </VictoryChart>
      <VictoryLegend
        x={width / 2 - 100}
        data={legendData}
        orientation="horizontal"
        style={{
          labels: { fill: theme.colors.text }
        }}
      />
    </View>
  );
});

MacroNutrientsChart.propTypes = {
  data: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
        color: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      })
    ).isRequired,
  })
};

MacroNutrientsChart.displayName = 'MacroNutrientsChart';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  }
});

export default MacroNutrientsChart;

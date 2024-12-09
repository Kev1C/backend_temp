// frontend/Components/WorkoutHeatmap/Heatmap.js

import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Rect, Text as SvgText, G, Circle } from 'react-native-svg';
import PropTypes from 'prop-types'; // Import PropTypes for type checking
import moment from 'moment'; // Import moment to use moment.isMoment
import styles from './WorkoutHeatmap.styles';

const Heatmap = ({
  dateMatrix,
  determineFillColor, // Function to determine the fill color of each cell
  isPR, // Function to determine if a date has a PR
  handleDatePress, // Function to handle date press
  CELL_SIZE,
  CELL_MARGIN,
  width,
  theme,
  currentMonth, // Moment object representing the current month
}) => {
  // Defensive check for currentMonth
  if (!currentMonth || typeof currentMonth.month !== 'function') {
    console.error('Heatmap component requires a valid currentMonth prop of type Moment.');
    return null; // Or render a fallback UI
  }

  // Validate dateMatrix contents
  dateMatrix.forEach((week, weekIndex) => {
    week.forEach((date, dayIndex) => {
      if (!moment.isMoment(date)) {
        console.error(`Heatmap: Invalid date at week ${weekIndex}, day ${dayIndex}:`, date);
      }
    });
  });

  return (
    <ScrollView
      horizontal={false}
      contentContainerStyle={styles.heatmapContainer}
    >
      <Svg
        width={width}
        height={(CELL_SIZE + CELL_MARGIN) * dateMatrix.length + 40}
        style={styles.heatmap}
      >
        {dateMatrix.map((week, weekIndex) =>
          week.map(date => {
            const dayIndex = date.day(); // 0 (Sunday) to 6 (Saturday)
            const x = dayIndex * (CELL_SIZE + CELL_MARGIN);
            const y = weekIndex * (CELL_SIZE + CELL_MARGIN);
            const isCurrentMonth = date.month() === currentMonth.month(); // Use currentMonth prop
            const fillColor = determineFillColor(date); // Get color based on data
            const dateStr = date.format('YYYY-MM-DD');
            const pr = isPR(dateStr);

            return (
              <G key={dateStr}>
                <TouchableOpacity
                  onPress={() => handleDatePress(date)}
                  accessible={true}
                  accessibilityLabel={`Workout on ${date.format('MMMM Do YYYY')}`}
                  accessibilityRole="button"
                >
                  <Rect
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    fill={isCurrentMonth ? fillColor : theme.colors.disabled}
                    rx={4}
                    ry={4}
                  />
                  <SvgText
                    x={x + CELL_SIZE / 2}
                    y={y + CELL_SIZE / 2 + 4}
                    fontSize={10}
                    fill={theme.colors.text}
                    textAnchor="middle"
                  >
                    {date.date()}
                  </SvgText>
                  {pr && (
                    <Circle
                      cx={x + CELL_SIZE - 6}
                      cy={y + 6}
                      r={4}
                      fill="gold"
                    />
                  )}
                </TouchableOpacity>
              </G>
            );
          })
        )}
      </Svg>
    </ScrollView>
  );
};

// Define PropTypes for better type checking and to catch missing props
Heatmap.propTypes = {
  dateMatrix: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.object.isRequired // Expect each date to be a Moment object
    ).isRequired
  ).isRequired,
  determineFillColor: PropTypes.func.isRequired,
  isPR: PropTypes.func.isRequired,
  handleDatePress: PropTypes.func.isRequired,
  CELL_SIZE: PropTypes.number.isRequired,
  CELL_MARGIN: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  theme: PropTypes.shape({
    colors: PropTypes.shape({
      disabled: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      // Add other color properties if they exist
    }).isRequired,
  }).isRequired,
  currentMonth: PropTypes.object.isRequired, // Expecting a Moment object
};

export default Heatmap;
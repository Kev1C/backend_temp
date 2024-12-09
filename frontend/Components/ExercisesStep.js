// frontend/Components/ExercisesStep.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const ExercisesStep = ({ routineData, updateRoutineData }) => {
  const theme = useTheme();
  const styles = exercisesStyles();

  return (
    <View>
      <Text variant="headlineMedium">Select Your Exercises</Text>
      {/* Placeholder for exercise selection UI */}
      <Text style={styles.placeholderText}>
        Implement exercise selection here. You can include search functionality,
        categories, and selection of multiple exercises.
      </Text>
    </View>
  );
};

const exercisesStyles = () =>
  StyleSheet.create({
    placeholderText: {
      color: '#666',
      marginTop: 16,
    },
  });

export default ExercisesStep;
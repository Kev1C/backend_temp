// frontend/screens/Profile/WorkoutHeatmapScreen.js

import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from 'react-native-paper';
import WorkoutHeatmap from '../../Components/WorkoutHeatmap/WorkoutHeatmap';

const WorkoutHeatmapScreen = () => {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <WorkoutHeatmap />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default WorkoutHeatmapScreen;

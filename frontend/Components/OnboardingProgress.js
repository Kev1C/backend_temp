import React from 'react';
import { View, StyleSheet } from 'react-native';

const ONBOARDING_STEPS = [
  'GenderSelection',
  'AgeSelection',
  'HeightWeight',
  'ActivityLevel',
  'GoalSelection',
  'SocialAuth'
];

const OnboardingProgress = ({ currentScreen }) => {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentScreen);
  const progress = currentScreen === 'SocialAuth' ? 0.98 : (currentIndex + 1) / ONBOARDING_STEPS.length;

  return (
    <View style={styles.container}>
      <View style={styles.progressBackground}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
});

export default OnboardingProgress;

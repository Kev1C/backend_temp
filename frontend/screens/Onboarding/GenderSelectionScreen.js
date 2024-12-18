// screens/onboarding/GenderSelectionScreen.js
import React from 'react';
import { SafeAreaView, Alert } from 'react-native';
import styles from './GenderSelection.styles';
import GenderSelection from '../../Components/GenderSelection';
import OnboardingProgress from '../../Components/OnboardingProgress';
import { useOnboardingStore } from '../../stores/onboardingStore';

const GenderSelectionScreen = ({ navigation }) => {
  const { saveOnboardingData } = useOnboardingStore();

  const handleNext = async (gender) => {
    try {
      await saveOnboardingData({ gender });
      navigation.navigate('AgeSelection');
    } catch (error) {
      console.error('Error saving gender:', error);
      Alert.alert(
        'Error',
        'Failed to save your gender selection. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingProgress currentScreen="GenderSelection" />
      <GenderSelection onNext={handleNext} />
    </SafeAreaView>
  );
};

export default GenderSelectionScreen;
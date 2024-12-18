// screens/onboarding/GenderSelectionScreen.js
import React from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView edges={['top']} style={styles.container}>
      <OnboardingProgress currentScreen="GenderSelection" />
      <GenderSelection onNext={handleNext} />
    </SafeAreaView>
  );
};

export default GenderSelectionScreen;
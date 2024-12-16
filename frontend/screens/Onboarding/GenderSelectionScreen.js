// screens/onboarding/GenderSelectionScreen.js
import React from 'react';
import { SafeAreaView, Alert } from 'react-native';
import styles from './GenderSelection.styles';
import GenderSelection from '../../Components/GenderSelection';
import { useOnboardingStore } from '../../stores/onboardingStore';

const GenderSelectionScreen = ({ navigation }) => {
  const { saveOnboardingData } = useOnboardingStore();

  const handleNext = async (gender) => {
    try {
      // Update onboarding store with gender
      await saveOnboardingData({ gender });
      // Navigate to next screen
      navigation.navigate('AgeSelection');
    } catch (error) {
      console.error('Error saving gender:', error);
      Alert.alert(
        'Error',
        'Failed to save your gender selection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <GenderSelection onNext={handleNext} />
    </SafeAreaView>
  );
};

export default GenderSelectionScreen;
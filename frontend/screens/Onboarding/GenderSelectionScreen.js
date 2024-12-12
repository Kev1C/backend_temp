// screens/onboarding/GenderSelectionScreen.js
import React, { useContext } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import styles from './GenderSelection.styles';
import GenderSelection from '../../Components/GenderSelection';
import { OnboardingContext } from '../../context/OnboardingContext';

const GenderSelectionScreen = ({ navigation }) => {
  const { saveOnboardingData } = useContext(OnboardingContext);

  const handleNext = async (gender) => {
    try {
      // Update onboarding context with gender
      await saveOnboardingData({ gender });
      // Navigate to next screen
      navigation.navigate('HeightWeight');
    } catch (error) {
      console.error('Error saving gender:', error);
      Alert.alert(
        'Error',
        'Failed to save your gender selection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <GenderSelection onNext={handleNext} onBack={handleBack} />
    </SafeAreaView>
  );
};

export default GenderSelectionScreen;
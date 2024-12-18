// screens/onboarding/GenderSelectionScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styles from './GenderSelection.styles';
import Button from '../../Components/Button';
import OnboardingProgress from '../../Components/OnboardingProgress';
import sharedStyles from './SharedOnboardingLayout.styles';
import { useOnboardingStore } from '../../stores/onboardingStore';

const GenderSelectionScreen = ({ navigation }) => {
  const { saveOnboardingData } = useOnboardingStore();
  const [selectedGender, setSelectedGender] = useState(null);

  const handleNext = async () => {
    try {
      await saveOnboardingData({ gender: selectedGender });
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
    <SafeAreaView edges={['top']} style={sharedStyles.container}>
      <OnboardingProgress currentScreen="GenderSelection" />
      <View style={sharedStyles.content}>
        <Text style={styles.title}>What is your gender?</Text>
        <Text style={styles.subtitle}>Let us know you better</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionContainer,
              selectedGender === 'female' && styles.selectedOptionFemale
            ]}
            onPress={() => setSelectedGender('female')}
          >
            <Ionicons
              name="female"
              size={24}
              color={selectedGender === 'female' ? "#FF69B4" : "#666"}
            />
            <Text style={[
              styles.optionText,
              selectedGender === 'female' && styles.selectedTextFemale
            ]}>
              Female
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionContainer,
              selectedGender === 'male' && styles.selectedOptionMale
            ]}
            onPress={() => setSelectedGender('male')}
          >
            <Ionicons
              name="male"
              size={24}
              color={selectedGender === 'male' ? "#4169E1" : "#666"}
            />
            <Text style={[
              styles.optionText,
              selectedGender === 'male' && styles.selectedTextMale
            ]}>
              Male
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={sharedStyles.footer}>
        <Button
          title="Continue"
          onPress={handleNext}
          disabled={!selectedGender}
        />
      </View>
    </SafeAreaView>
  );
};

export default GenderSelectionScreen;
// components/onboarding/GenderSelection.js
import React, { useState, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import styles from './GenderSelection.styles';
import sharedStyles from '../screens/Onboarding/SharedOnboardingLayout.styles';

const GenderOption = memo(({ 
  gender, 
  isSelected, 
  onSelect, 
  iconName, 
  color, 
  selectedColor 
}) => (
  <TouchableOpacity
    style={[
      styles.optionContainer,
      isSelected && (gender === 'female' ? styles.selectedOptionFemale : styles.selectedOptionMale)
    ]}
    onPress={() => onSelect(gender)}
  >
    <Ionicons
      name={iconName}
      size={24}
      color={isSelected ? selectedColor : "#666"}
    />
    <Text style={[
      styles.optionText,
      isSelected && (gender === 'female' ? styles.selectedTextFemale : styles.selectedTextMale)
    ]}>
      {gender.charAt(0).toUpperCase() + gender.slice(1)}
    </Text>
  </TouchableOpacity>
));

const GenderSelection = ({ onNext }) => {
  const [selectedGender, setSelectedGender] = useState(null);

  const handleGenderSelect = useCallback((gender) => {
    setSelectedGender(gender);
  }, []);

  const handleNext = useCallback(() => {
    if (selectedGender) {
      onNext(selectedGender);
    }
  }, [selectedGender, onNext]);

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.content}>
        <View style={styles.optionsContainer}>
          <GenderOption
            gender="female"
            isSelected={selectedGender === 'female'}
            onSelect={handleGenderSelect}
            iconName="female"
            selectedColor="#FF69B4"
          />
          <GenderOption
            gender="male"
            isSelected={selectedGender === 'male'}
            onSelect={handleGenderSelect}
            iconName="male"
            selectedColor="#4169E1"
          />
        </View>
      </View>
      <View style={sharedStyles.footer}>
        <Button
          title="Continue"
          onPress={handleNext}
          disabled={!selectedGender}
        />
      </View>
    </View>
  );
};

export default memo(GenderSelection);
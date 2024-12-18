// components/onboarding/GenderSelection.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import styles from './GenderSelection.styles';
import sharedStyles from '../screens/Onboarding/SharedOnboardingLayout.styles';

const GenderSelection = ({ onNext }) => {
  const [selectedGender, setSelectedGender] = useState(null);

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.content}>
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
          onPress={() => onNext(selectedGender)}
          disabled={!selectedGender}
        />
      </View>
    </View>
  );
};

export default GenderSelection;
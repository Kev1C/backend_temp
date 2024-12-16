// components/onboarding/GenderSelection.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import styles from './GenderSelection.styles';

const GenderSelection = ({ onNext }) => {
  const [selectedGender, setSelectedGender] = useState(null);

  const handleContinue = () => {
    if (selectedGender) {
      onNext(selectedGender);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
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
              color={selectedGender === 'male' ? "#87CEEB" : "#666"}
            />
            <Text style={[
              styles.optionText,
              selectedGender === 'male' && styles.selectedTextMale
            ]}>
              Male
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.noneButton}>
          <Text style={styles.noneButtonText}>None of the above</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedGender}
          style={[
            styles.continueButton,
            { backgroundColor: selectedGender ? '#2196F3' : '#ccc' }
          ]}
        />
      </View>
    </View>
  );
};

export default GenderSelection;
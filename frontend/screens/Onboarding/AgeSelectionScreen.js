import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './ActivityLevel.styles';
import Button from '../../Components/Button';
import OnboardingProgress from '../../Components/OnboardingProgress';
import { useOnboardingStore } from '../../stores/onboardingStore';

const AGE_RANGES = [
  {
    id: '18_24',
    title: '18-24',
    subtitle: 'Young Adult',
    icon: 'human',
  },
  {
    id: '25_34',
    title: '25-34',
    subtitle: 'Adult',
    icon: 'human',
  },
  {
    id: '35_44',
    title: '35-44',
    subtitle: 'Adult',
    icon: 'human',
  },
  {
    id: '45_54',
    title: '45-54',
    subtitle: 'Middle Age',
    icon: 'human',
  },
  {
    id: '55_64',
    title: '55-64',
    subtitle: 'Senior Adult',
    icon: 'human',
  },
  {
    id: '65_plus',
    title: '65+',
    subtitle: 'Senior Adult',
    icon: 'human',
  },
];

const AgeSelectionScreen = ({ navigation }) => {
  const [selectedAge, setSelectedAge] = React.useState('18_24');
  const { saveOnboardingData } = useOnboardingStore();

  const handleAgeSelection = (ageId) => {
    setSelectedAge(ageId);
  };

  const handleContinue = async () => {
    if (selectedAge) {
      try {
        await saveOnboardingData({ ageRange: selectedAge });
        navigation.navigate('HeightWeight');
      } catch (error) {
        console.error('Error saving age range:', error);
        Alert.alert(
          'Error',
          'Failed to save your age range. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingProgress currentScreen="AgeSelection" />
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What's your age?</Text>
        <Text style={styles.subtitle}>This helps us personalize your fitness journey</Text>

        <View style={styles.levelsContainer}>
          {AGE_RANGES.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                styles.levelCard,
                selectedAge === range.id && styles.selectedLevelCard,
              ]}
              onPress={() => handleAgeSelection(range.id)}
            >
              <MaterialCommunityIcons
                name={range.icon}
                size={24}
                color={selectedAge === range.id ? '#fff' : '#000'}
              />
              <View style={styles.levelTextContainer}>
                <Text 
                  style={[
                    styles.levelTitle,
                    selectedAge === range.id && styles.selectedText
                  ]}
                >
                  {range.title}
                </Text>
                <Text 
                  style={[
                    styles.levelSubtitle,
                    selectedAge === range.id && styles.selectedText
                  ]}
                >
                  {range.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedAge}
          style={{ backgroundColor: selectedAge ? '#2196F3' : '#ccc' }}
        />
      </View>
    </SafeAreaView>
  );
};

export default AgeSelectionScreen;

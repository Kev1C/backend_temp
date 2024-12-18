import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './ActivityLevel.styles';
import Button from '../../Components/Button';
import OnboardingProgress from '../../Components/OnboardingProgress';
import sharedStyles from './SharedOnboardingLayout.styles';
import { useOnboardingStore } from '../../stores/onboardingStore';

const AGE_RANGES = Object.freeze([
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
]);

const AgeSelectionScreen = React.memo(({ navigation }) => {
  const [selectedAge, setSelectedAge] = React.useState('18_24');
  const { saveOnboardingData } = useOnboardingStore();

  const handleAgeSelection = React.useCallback((ageId) => {
    setSelectedAge(ageId);
  }, []);

  const handleContinue = React.useCallback(async () => {
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
  }, [selectedAge, saveOnboardingData, navigation]);

  const renderAgeRange = React.useCallback(({ id, title, subtitle, icon }) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.levelCard,
        selectedAge === id && styles.selectedLevelCard,
      ]}
      onPress={() => handleAgeSelection(id)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={selectedAge === id ? '#FFFFFF' : '#000000'}
      />
      <View style={styles.levelTextContainer}>
        <Text 
          style={[
            styles.levelTitle,
            selectedAge === id && styles.selectedText
          ]}
        >
          {title}
        </Text>
        <Text 
          style={[
            styles.levelSubtitle,
            selectedAge === id && styles.selectedText
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  ), [selectedAge, handleAgeSelection]);

  return (
    <SafeAreaView edges={['top']} style={sharedStyles.container}>
      <OnboardingProgress currentScreen="AgeSelection" />
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={sharedStyles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={sharedStyles.content}>
        <Text style={styles.title}>What's your age?</Text>
        <Text style={styles.subtitle}>This helps us personalize your fitness journey</Text>

        <View style={styles.levelsContainer}>
          {AGE_RANGES.map((range) => renderAgeRange(range))}
        </View>
      </View>

      <View style={sharedStyles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedAge}
          style={{ backgroundColor: selectedAge ? '#2196F3' : '#ccc' }}
        />
      </View>
    </SafeAreaView>
  );
});

export default AgeSelectionScreen;

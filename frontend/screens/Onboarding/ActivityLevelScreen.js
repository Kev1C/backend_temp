import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './ActivityLevel.styles';
import Button from '../../Components/Button';
import OnboardingProgress from '../../Components/OnboardingProgress';
import sharedStyles from './SharedOnboardingLayout.styles';
import { useOnboardingStore } from '../../stores/onboardingStore';

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    subtitle: 'Little to no exercise',
    icon: 'seat',
  },
  {
    id: 'lightly_active',
    title: 'Lightly Active',
    subtitle: 'Light exercise 1-3 days/week',
    icon: 'walk',
  },
  {
    id: 'moderately_active',
    title: 'Moderately Active',
    subtitle: 'Moderate exercise 3-5 days/week',
    icon: 'run',
  },
  {
    id: 'very_active',
    title: 'Very Active',
    subtitle: 'Hard exercise 6-7 days/week',
    icon: 'weight-lifter',
  },
];

const ActivityLevelScreen = ({ navigation }) => {
  const [selectedLevel, setSelectedLevel] = React.useState('lightly_active');
  const { saveOnboardingData } = useOnboardingStore();

  const handleActivitySelection = (levelId) => {
    setSelectedLevel(levelId);
  };

  const handleContinue = async () => {
    if (selectedLevel) {
      try {
        await saveOnboardingData({ activityLevel: selectedLevel });
        navigation.navigate('GoalSelection');
      } catch (error) {
        console.error('Error saving activity level:', error);
        Alert.alert(
          'Error',
          'Failed to save your activity level. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <SafeAreaView edges={['top']} style={sharedStyles.container}>
      <OnboardingProgress currentScreen="ActivityLevel" />
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={sharedStyles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={sharedStyles.content}>
        <Text style={styles.title}>How active are you?</Text>
        <Text style={styles.subtitle}>This helps us calculate your daily calorie needs</Text>

        <View style={styles.levelsContainer}>
          {ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelCard,
                selectedLevel === level.id && styles.selectedLevelCard,
              ]}
              onPress={() => handleActivitySelection(level.id)}
            >
              <MaterialCommunityIcons
                name={level.icon}
                size={24}
                color={selectedLevel === level.id ? '#fff' : '#000'}
              />
              <View style={styles.levelTextContainer}>
                <Text 
                  style={[
                    styles.levelTitle,
                    selectedLevel === level.id && styles.selectedText
                  ]}
                >
                  {level.title}
                </Text>
                <Text 
                  style={[
                    styles.levelSubtitle,
                    selectedLevel === level.id && styles.selectedText
                  ]}
                >
                  {level.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={sharedStyles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedLevel}
          style={{ backgroundColor: selectedLevel ? '#2196F3' : '#ccc' }}
        />
      </View>
    </SafeAreaView>
  );
};

export default ActivityLevelScreen;

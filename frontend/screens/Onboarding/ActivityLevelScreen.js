import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const ActivityCard = React.memo(({ id, icon, title, subtitle, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.levelCard, isSelected && styles.selectedLevelCard]}
    onPress={() => onSelect(id)}
  >
    <MaterialCommunityIcons
      name={icon}
      size={24}
      color={isSelected ? '#fff' : '#000'}
    />
    <View style={styles.levelTextContainer}>
      <Text style={[styles.levelTitle, isSelected && styles.selectedText]}>
        {title}
      </Text>
      <Text style={[styles.levelSubtitle, isSelected && styles.selectedText]}>
        {subtitle}
      </Text>
    </View>
  </TouchableOpacity>
));

const ActivityLevelScreen = ({ navigation }) => {
  const [selectedLevel, setSelectedLevel] = React.useState('lightly_active');
  const { saveOnboardingData } = useOnboardingStore();
  const insets = useSafeAreaInsets();

  const handleActivitySelection = useCallback((levelId) => {
    setSelectedLevel(levelId);
  }, []);

  const handleContinue = useCallback(async () => {
    if (selectedLevel) {
      try {
        await saveOnboardingData({ activityLevel: selectedLevel });
        navigation.navigate('GoalSelection');
      } catch (error) {
        Alert.alert(
          'Error',
          'Failed to save your activity level. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [selectedLevel, saveOnboardingData, navigation]);

  const activityLevels = useMemo(() => 
    ACTIVITY_LEVELS.map(level => (
      <ActivityCard
        key={level.id}
        {...level}
        isSelected={selectedLevel === level.id}
        onSelect={handleActivitySelection}
      />
    ))
  , [selectedLevel, handleActivitySelection]);

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
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
          {activityLevels}
        </View>
      </View>

      <View style={[sharedStyles.footer, { paddingBottom: insets.bottom }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedLevel}
          style={{ backgroundColor: selectedLevel ? '#2196F3' : '#ccc' }}
        />
      </View>
    </View>
  );
};

export default ActivityLevelScreen;
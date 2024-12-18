import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './GoalSelection.styles';
import Button from '../../Components/Button';
import OnboardingProgress from '../../Components/OnboardingProgress';
import sharedStyles from './SharedOnboardingLayout.styles';
import { useOnboardingStore } from '../../stores/onboardingStore';

const GOALS = [
  {
    id: 'lose_weight',
    title: 'Lose weight',
    subtitle: 'Burn fat & get lean',
    icon: 'fire',
  },
  {
    id: 'get_fitter',
    title: 'Get fitter',
    subtitle: 'Tone up & feel healthy',
    icon: 'heart-pulse',
  },
  {
    id: 'gain_muscle',
    title: 'Gain muscles',
    subtitle: 'Build mass & strength',
    icon: 'dumbbell',
  },
];

const GoalSelectionScreen = ({ navigation }) => {
  const [selectedGoal, setSelectedGoal] = React.useState('get_fitter');
  const { saveOnboardingData, onboardingData } = useOnboardingStore();

  const handleGoalSelection = (goalId) => {
    setSelectedGoal(goalId);
  };

  const handleContinue = async () => {
    if (selectedGoal) {
      try {
        // Update onboarding data with selected goal and wait for it to complete
        await saveOnboardingData({ fitnessGoal: selectedGoal });
        
        // Navigate to social auth screen
        navigation.navigate('SocialAuth');
      } catch (error) {
        console.error('Error saving fitness goal:', error);
        Alert.alert(
          'Error',
          'Failed to save your fitness goal. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <SafeAreaView edges={['top']} style={sharedStyles.container}>
      <OnboardingProgress currentScreen="GoalSelection" />
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={sharedStyles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={sharedStyles.content}>
        <Text style={styles.title}>What's your goal?</Text>
        <Text style={styles.subtitle}>Help us tailor your fitness journey</Text>

        <View style={styles.goalsContainer}>
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                selectedGoal === goal.id && styles.selectedGoalCard,
              ]}
              onPress={() => handleGoalSelection(goal.id)}
            >
              <MaterialCommunityIcons
                name={goal.icon}
                size={24}
                color={selectedGoal === goal.id ? '#fff' : '#000'}
              />
              <View style={styles.goalTextContainer}>
                <Text 
                  style={[
                    styles.goalTitle,
                    selectedGoal === goal.id && styles.selectedText
                  ]}
                >
                  {goal.title}
                </Text>
                <Text 
                  style={[
                    styles.goalSubtitle,
                    selectedGoal === goal.id && styles.selectedText
                  ]}
                >
                  {goal.subtitle}
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
          disabled={!selectedGoal}
          style={{ backgroundColor: selectedGoal ? '#2196F3' : '#ccc' }}
        />
      </View>
    </SafeAreaView>
  );
};

export default GoalSelectionScreen;

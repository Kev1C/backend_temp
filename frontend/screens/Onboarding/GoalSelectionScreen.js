import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './GoalSelection.styles';
import Button from '../../Components/Button';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What is your goal?</Text>
        <Text style={styles.subtitle}>Let us know you better</Text>

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

      <View style={styles.footer}>
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

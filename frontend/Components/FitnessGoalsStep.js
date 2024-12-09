// frontend/Components/FitnessGoalsStep.js
import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Typography, { H2 } from './Typography';
import CustomPicker from './CustomPicker';

const FitnessGoalsStep = ({ routineData, updateRoutineData }) => {
  const { theme } = useContext(ThemeContext);

  const fitnessGoals = [
    { label: 'Build Muscle', value: 'muscle', icon: 'dumbbell' },
    { label: 'Lose Weight', value: 'weight', icon: 'scale' },
    { label: 'Increase Flexibility', value: 'flexibility', icon: 'yoga' },
    { label: 'Improve Endurance', value: 'endurance', icon: 'run' },
    { label: 'Toning', value: 'toning', icon: 'human' },
    { label: 'General Fitness', value: 'general', icon: 'heart-pulse' },
    { label: 'Custom Goal', value: 'custom', icon: 'pencil' },
  ];

  return (
    <View style={styles.container}>
      <H2 style={[styles.title, { color: theme.colors.text }]}>
        Select Your Fitness Goals
      </H2>
      
      <Typography style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        This helps us customize your workout plan
      </Typography>

      <View style={styles.goalsContainer}>
        {fitnessGoals.map((goal) => (
          <Chip
            key={goal.value}
            onPress={() => updateRoutineData('goal', goal.value)}
            selected={routineData.goal === goal.value}
            style={[
              styles.goalChip,
              routineData.goal === goal.value && { backgroundColor: theme.colors.primary },
            ]}
            selectedColor="#fff"
            textStyle={{
              color: routineData.goal === goal.value ? '#fff' : theme.colors.primary,
            }}
            icon={() => (
              <Icon
                name={goal.icon}
                size={20}
                color={routineData.goal === goal.value ? '#fff' : theme.colors.primary}
              />
            )}
          >
            {goal.label}
          </Chip>
        ))}
      </View>
      {routineData.goal === 'custom' && (
        <TextInput
          label="Custom Goal"
          value={routineData.customGoal}
          onChangeText={(text) => updateRoutineData('customGoal', text)}
          style={styles.input}
          mode="outlined"
          placeholder="Enter your custom goal"
          theme={{ colors: { primary: theme.colors.primary, background: theme.colors.background } }}
        />
      )}
      <Typography style={[styles.hint, { color: theme.colors.textSecondary }]}>
        Don't worry, you can change this later
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  goalChip: {
    margin: 4,
  },
  input: {
    marginTop: 16,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
  }
});

export default FitnessGoalsStep;
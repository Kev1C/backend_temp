// frontend/utils/heatmapUtils.js

import moment from 'moment';

/**
 * Fetch and process workout data.
 * Replace the mock data with real API calls or database queries as needed.
 */
export const getWorkoutData = () => {
  // Sample data structure
  // {
  //   Cardio: { '2023-10-01': { duration: 30, calories: 300, heartRate: { zones: {...} }, PR: true }, ... },
  //   StrengthTraining: { '2023-10-01': { volume: 80, reps: 3, sets: 4, weight: 50, calories: 200, muscleGroup: 'Upper Body', PR: false }, ... },
  //   Flexibility: { '2023-10-01': { duration: 20, calories: 150, recoveryLevel: 'High', PR: false }, ... },
  // }

  // For demonstration, generate random data for the current month
  const currentMonth = moment().month();
  const currentYear = moment().year();
  const daysInMonth = moment().daysInMonth();
  const categories = ['Cardio', 'StrengthTraining', 'Flexibility'];
  
  const workoutData = {
    Cardio: {},
    StrengthTraining: {},
    Flexibility: {},
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const date = moment({ year: currentYear, month: currentMonth, day }).format('YYYY-MM-DD');
    
    // Randomly decide if the user worked out on this day
    if (Math.random() > 0.3) {
      // Cardio
      if (Math.random() > 0.5) {
        workoutData.Cardio[date] = {
          duration: Math.floor(Math.random() * 60) + 10, // 10-70 minutes
          calories: Math.floor(Math.random() * 500) + 100, // 100-600 calories
          heartRate: {
            zone1: Math.floor(Math.random() * 20),
            zone2: Math.floor(Math.random() * 20),
            zone3: Math.floor(Math.random() * 20),
            zone4: Math.floor(Math.random() * 20),
            zone5: Math.floor(Math.random() * 20),
          },
          PR: Math.random() > 0.8, // 20% chance of being a PR
        };
      }

      // Strength Training
      if (Math.random() > 0.5) {
        const muscleGroups = ['Chest', 'Shoulders', 'Back', 'Arms', 'Legs', 'Quads', 'Hamstrings', 'Calves', 'Glutes', 'Abs', 'Obliques', 'Lower Back'];
        const selectedMuscleGroup = muscleGroups[Math.floor(Math.random() * muscleGroups.length)];
        workoutData.StrengthTraining[date] = {
          volume: Math.floor(Math.random() * 200) + 50, // 50-250
          reps: Math.floor(Math.random() * 5) + 3, // 3-7
          sets: Math.floor(Math.random() * 3) + 3, // 3-5
          weight: Math.floor(Math.random() * 50) + 20, // 20-70 kg
          calories: Math.floor(Math.random() * 400) + 100, // 100-500 calories
          muscleGroup: selectedMuscleGroup,
          PR: Math.random() > 0.8, // 20% chance of being a PR
        };
      }

      // Flexibility/Recovery
      if (Math.random() > 0.5) {
        workoutData.Flexibility[date] = {
          duration: Math.floor(Math.random() * 60) + 10, // 10-70 minutes
          calories: Math.floor(Math.random() * 200) + 50, // 50-250 calories
          recoveryLevel: Math.random() > 0.5 ? 'High' : 'Low',
          PR: Math.random() > 0.95, // 5% chance of being a PR
        };
      }
    }
  }

  return workoutData;
};
// frontend/Components/WorkoutHeatmap/helpers.js

export const getCategoryColor = category => {
    const categoryMap = {
      Cardio: '#5CB1F6',
      StrengthTraining: '#6EE7B7',
      Flexibility: '#A569BD',
    };
    return categoryMap[category] || '#000';
  };
  
  export const getMetricsText = entry => {
    const { category, data } = entry;
    switch (category) {
      case 'Cardio':
        return `Duration: ${data.duration}m, Calories: ${data.calories}`;
      case 'StrengthTraining':
        return `Volume: ${data.volume}, Reps: ${data.reps}, Sets: ${data.sets}, Weight: ${data.weight}kg, Calories: ${data.calories}`;
      case 'Flexibility':
        return `Duration: ${data.duration}m, Calories: ${data.calories}`;
      default:
        return '';
    }
  };
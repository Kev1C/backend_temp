// Nutrient calculations hook for determining daily requirements
export const useNutrientCalculations = () => {
  const calculateBMR = (gender, weight, height, age) => {
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

  const getActivityMultiplier = (activityLevel) => {
    const multipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725
    };
    return multipliers[activityLevel] || 1.2;
  };

  const getAgeFromRange = (ageRange) => {
    const ranges = {
      '18-24': 21,
      '25-34': 29,
      '35-44': 39,
      '45-54': 49,
      '55-64': 59,
      '65+': 70
    };
    return ranges[ageRange] || 30;
  };

  const getGoalMultiplier = (goal) => {
    const multipliers = {
      'lose_weight': 0.8,
      'get_fitter': 1.0,
      'gain_muscle': 1.2
    };
    return multipliers[goal] || 1.0;
  };

  const calculateDailyRequirements = (userData) => {
    const {
      gender,
      weight, // in kg
      height, // in cm
      ageRange,
      activityLevel,
      goal
    } = userData;

    const age = getAgeFromRange(ageRange);
    const bmr = calculateBMR(gender, weight, height, age);
    const activityMultiplier = getActivityMultiplier(activityLevel);
    const goalMultiplier = getGoalMultiplier(goal);

    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityMultiplier;
    
    // Calculate daily calories based on goal
    const dailyCalories = Math.round(tdee * goalMultiplier);

    // Calculate macronutrients
    let proteinGrams, carbsGrams, fatGrams;

    if (goal === 'gain_muscle') {
      proteinGrams = Math.round(weight * 2.2); // 2.2g per kg of body weight
      fatGrams = Math.round((dailyCalories * 0.25) / 9); // 25% of calories from fat
      carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);
    } else if (goal === 'lose_weight') {
      proteinGrams = Math.round(weight * 2); // 2g per kg of body weight
      fatGrams = Math.round((dailyCalories * 0.3) / 9); // 30% of calories from fat
      carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);
    } else {
      // get_fitter or default
      proteinGrams = Math.round(weight * 1.8); // 1.8g per kg of body weight
      fatGrams = Math.round((dailyCalories * 0.25) / 9); // 25% of calories from fat
      carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);
    }

    return {
      dailyCalories,
      macros: {
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams
      }
    };
  };

  return {
    calculateDailyRequirements
  };
};

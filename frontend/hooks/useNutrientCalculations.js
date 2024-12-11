import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useNutrientCalculations = () => {
  const { user } = useContext(AuthContext);

  const calculateNutrients = () => {
    // If user is null or undefined, return default values based on an average adult
    if (!user) {
      console.log('No user data available, returning default values for an average adult');
      return {
        calories: 2000, // Average daily calorie intake
        protein: 56,   // Average protein in grams for an adult male
        fat: 70,        // Average fat in grams
        carbs: 310      // Average carbs in grams
      };
    }

    const { gender, weight, height, goal } = user;

    // Validate user data and provide default values if needed
    const validatedData = {
      gender: gender?.toLowerCase() || 'male', // Default male
      weight: typeof weight === 'number' && weight > 0 ? weight : 70, // Default 70kg
      height: typeof height === 'number' && height > 0 ? height : 170, // Default 170cm
      goal: ['lose_weight', 'get_fitter', 'gain_muscle'].includes(goal) ? goal : 'get_fitter' // Default goal
    };

    // Calculate BMR using validated data
    let BMR;
    if (validatedData.gender === "male") {
      BMR = (10 * validatedData.weight) + (6.25 * validatedData.height) + 5;
    } else {
      BMR = (10 * validatedData.weight) + (6.25 * validatedData.height) - 161;
    }

    // Calculate daily calories based on goal
    let calories;
    switch(validatedData.goal) {
      case "lose_weight":
        calories = BMR - 500;
        break;
      case "get_fitter":
        calories = BMR;
        break;
      case "gain_muscle":
        calories = BMR + 300;
        break;
      default:
        calories = BMR; // Default to maintenance calories
    }

    // Calculate protein requirements (in grams)
    let protein;
    switch(validatedData.goal) {
      case "lose_weight":
        protein = validatedData.weight * 2.0;
        break;
      case "get_fitter":
        protein = validatedData.weight * 1.8;
        break;
      case "gain_muscle":
        protein = validatedData.weight * 2.2;
        break;
      default:
        protein = validatedData.weight * 1.8; // Default to moderate protein intake
    }

    // Calculate fat requirements (in grams)
    let fat = (calories * 0.25) / 9; // 25% of calories from fat
    // Calculate carbs requirements (in grams)
    let carbs = (calories - (protein * 4 + fat * 9)) / 4;

    // Round all values to whole numbers
    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      fat: Math.round(fat),
      carbs: Math.round(carbs)
    };
  };

  return calculateNutrients();
};

export default useNutrientCalculations;

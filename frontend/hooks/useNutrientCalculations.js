import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useNutrientCalculations = () => {
  const { user } = useContext(AuthContext);
  
  const calculateNutrients = () => {
    // If user is null or undefined, return default values
    if (!user) {
      console.log('No user data available, returning default values');
      return {
        calories: 2000, // Default daily calorie intake
        protein: 150,   // Default protein in grams
        fat: 65,        // Default fat in grams
        carbs: 250      // Default carbs in grams
      };
    }

    const { gender, weight, height, goal } = user;
    
    console.log('Raw user data:', { gender, weight, height, goal });
    
    // Validate user data and provide default values if needed
    const validatedData = {
      gender: gender?.toLowerCase() || 'male',
      weight: typeof weight === 'number' && weight > 0 ? weight : 70, // Default 70kg
      height: typeof height === 'number' && height > 0 ? height : 170, // Default 170cm
      goal: ['lose_weight', 'get_fitter', 'gain_muscle'].includes(goal) ? goal : 'get_fitter'
    };

    // Calculate BMR using validated data
    let BMR;
    if (validatedData.gender === "male") {
      BMR = (10 * validatedData.weight) + (6.25 * validatedData.height) + 5;
    } else {
      BMR = (10 * validatedData.weight) + (6.25 * validatedData.height) - 161;
    }

    console.log('Calculated BMR:', BMR);

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

    console.log('Calculated calories:', calories);

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

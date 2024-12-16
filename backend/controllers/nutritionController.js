// backend/controllers/nutritionController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Meal = require('../models/Meal');

// Cache for daily nutrition data (TTL: 5 minutes)
const nutritionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

const clearCacheEntry = (key) => {
  setTimeout(() => nutritionCache.delete(key), CACHE_TTL);
};

// Activity level multipliers
const ACTIVITY_MULTIPLIERS = {
  'sedentary': 1.2,
  'lightly_active': 1.375,
  'moderately_active': 1.55,
  'very_active': 1.725
};

// Age ranges average values
const AGE_RANGES = {
  '18_24': 21,
  '25_34': 29,
  '35_44': 39,
  '45_54': 49,
  '55_64': 59,
  '65_plus': 70
};

// @desc    Get daily nutrition data
// @route   GET /api/nutrition/daily/:date
// @access  Private
const getDailyNutrition = asyncHandler(async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.userId || req.user._id;

    console.log('Getting nutrition data for:', { userId, date });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID format:', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Check cache first
    const cacheKey = `${userId}-${date}`;
    if (nutritionCache.has(cacheKey)) {
      console.log('Returning cached nutrition data');
      return res.json(nutritionCache.get(cacheKey));
    }

    // Create date range for the given local date
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day);
    endDate.setHours(23, 59, 59, 999);

    console.log('Querying meals between:', { startDate, endDate });

    // Simplified query without heavy aggregation for better performance
    const meals = await Meal.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    console.log('Found meals:', meals);

    // Calculate totals in memory (faster than MongoDB aggregation for small datasets)
    const result = meals.reduce((acc, meal) => {
      acc.calories += Number(meal.calories) || 0;
      acc.protein += Number(meal.protein) || 0;
      acc.carbs += Number(meal.carbs) || 0;
      acc.fat += Number(meal.fats) || 0;  // Note: using fats from schema
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Add meals to the result
    result.meals = meals.map(meal => ({
      id: meal._id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fats,  // Note: using fats from schema
      image: meal.image,
      time: meal.time,
      date: meal.date
    }));

    console.log('Calculated nutrition:', result);

    // Cache the result
    nutritionCache.set(cacheKey, result);
    clearCacheEntry(cacheKey);

    res.json(result);
  } catch (error) {
    console.error('Error in getDailyNutrition:', error);
    res.status(500).json({ message: error.message || 'Error retrieving nutrition data' });
  }
});

// @desc    Get nutrition calculations based on user data
// @route   GET /api/nutrition/calculations
// @access  Private
const getNutritionCalculations = asyncHandler(async (req, res) => {
  const { gender, weight, height, fitnessGoal } = req.query;

  // Basic validation
  if (!gender || !weight || !height || !fitnessGoal) {
    return res.status(400).json({ 
      message: 'Missing required parameters: gender, weight, height, fitnessGoal' 
    });
  }

  // Calculate BMR using Harris-Benedict equation
  let bmr;
  const weightInKg = parseFloat(weight);
  const heightInCm = parseFloat(height);

  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weightInKg) + (4.799 * heightInCm) - (5.677 * 25);
  } else {
    bmr = 447.593 + (9.247 * weightInKg) + (3.098 * heightInCm) - (4.330 * 25);
  }

  // Adjust calories based on fitness goal
  let targetCalories = bmr;
  switch (fitnessGoal) {
    case 'lose_weight':
      targetCalories *= 0.85; // 15% deficit
      break;
    case 'gain_muscle':
      targetCalories *= 1.15; // 15% surplus
      break;
    default:
      // maintain weight
      break;
  }

  // Calculate macros
  const protein = weightInKg * (fitnessGoal === 'gain_muscle' ? 2.2 : 2.0); // g/kg
  const fat = weightInKg * 0.8; // g/kg
  const remainingCalories = targetCalories - (protein * 4) - (fat * 9);
  const carbs = Math.max(0, remainingCalories / 4);

  // Match frontend expected structure
  const calculations = {
    calories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  };

  res.json(calculations);
});

// @desc    Update daily macros
// @route   POST /api/nutrition/macros
// @access  Private
const updateMacros = asyncHandler(async (req, res) => {
  const { calories, protein, carbs, fat } = req.body;
  const userId = req.user.userId || req.user._id;

  // Store in cache with user-specific key
  const cacheKey = `macros-${userId}`;
  const macroData = { calories, protein, carbs, fat, lastUpdated: new Date() };
  nutritionCache.set(cacheKey, macroData);
  clearCacheEntry(cacheKey);

  res.json(macroData);
});

// @desc    Reset daily macros
// @route   POST /api/nutrition/macros/reset
// @access  Private
const resetMacros = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;
  const cacheKey = `macros-${userId}`;
  
  // Reset to zero
  const resetData = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    lastUpdated: new Date()
  };
  
  nutritionCache.set(cacheKey, resetData);
  clearCacheEntry(cacheKey);

  res.json(resetData);
});

// @desc    Calculate user's daily nutritional needs
// @route   POST /api/nutrition/calculate
// @access  Private
const calculateNutritionalNeeds = asyncHandler(async (req, res) => {
  const { gender, ageRange, height, weight, activityLevel, fitnessGoal } = req.body;

  // Basic validation
  if (!gender || !ageRange || !height || !weight || !activityLevel || !fitnessGoal) {
    return res.status(400).json({ 
      message: 'Missing required parameters' 
    });
  }

  // Get average age for the range
  const age = AGE_RANGES[ageRange] || 30;

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr;
  if (gender.toLowerCase() === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Get activity multiplier
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;

  // Calculate TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activityMultiplier;

  // Adjust calories based on fitness goal
  let calories;
  let proteinRatio, carbsRatio, fatRatio;

  switch (fitnessGoal) {
    case 'lose_weight':
      calories = tdee - 500; // 500 calorie deficit
      proteinRatio = 0.35; // Higher protein for muscle preservation
      carbsRatio = 0.35;
      fatRatio = 0.30;
      break;
    case 'get_fitter':
      calories = tdee;
      proteinRatio = 0.30;
      carbsRatio = 0.40;
      fatRatio = 0.30;
      break;
    case 'gain_muscle':
      calories = tdee + 300; // Caloric surplus for muscle gain
      proteinRatio = 0.30;
      carbsRatio = 0.45;
      fatRatio = 0.25;
      break;
    default:
      calories = tdee;
      proteinRatio = 0.30;
      carbsRatio = 0.40;
      fatRatio = 0.30;
  }

  // Calculate macros in grams
  const protein = Math.round((calories * proteinRatio) / 4); // 4 calories per gram of protein
  const carbs = Math.round((calories * carbsRatio) / 4);     // 4 calories per gram of carbs
  const fat = Math.round((calories * fatRatio) / 9);         // 9 calories per gram of fat

  const nutritionalNeeds = {
    calories: Math.round(calories),
    protein,
    carbs,
    fat
  };

  res.status(200).json(nutritionalNeeds);
});

module.exports = {
  getDailyNutrition,
  getNutritionCalculations,
  updateMacros,
  resetMacros,
  calculateNutritionalNeeds
};

// backend/controllers/nutritionController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Meal = require('../models/Meal');
const User = require('../models/User');
const { calculateBMR, getActivityMultiplier, getAgeFromRange, getGoalMultiplier } = require('../utils/nutritionCalculations');

// Cache for daily nutrition data (TTL: 5 minutes)
const nutritionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

const clearCacheEntry = (key) => {
  setTimeout(() => nutritionCache.delete(key), CACHE_TTL);
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

// Calculate and store user's nutritional requirements
const calculateNutritionRequirements = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { gender, weight, height, ageRange, activityLevel, goal } = user;

    // Validate required fields
    if (!gender || !weight || !height || !ageRange || !activityLevel || !goal) {
      return res.status(400).json({ 
        message: 'Missing required user data for calculations',
        missingFields: {
          gender: !gender,
          weight: !weight,
          height: !height,
          ageRange: !ageRange,
          activityLevel: !activityLevel,
          goal: !goal
        }
      });
    }

    const age = getAgeFromRange(ageRange);
    const bmr = calculateBMR(gender, weight, height, age);
    const activityMultiplier = getActivityMultiplier(activityLevel);
    const goalMultiplier = getGoalMultiplier(goal);

    // Calculate TDEE and daily calories
    const tdee = bmr * activityMultiplier;
    const dailyCalories = Math.round(tdee * goalMultiplier);

    // Calculate macronutrients
    let proteinGrams, carbsGrams, fatGrams;

    if (goal === 'gain_muscle') {
      proteinGrams = Math.round(weight * 2.2);
      fatGrams = Math.round((dailyCalories * 0.25) / 9);
      carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);
    } else if (goal === 'lose_weight') {
      proteinGrams = Math.round(weight * 2);
      fatGrams = Math.round((dailyCalories * 0.3) / 9);
      carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);
    } else {
      proteinGrams = Math.round(weight * 1.8);
      fatGrams = Math.round((dailyCalories * 0.25) / 9);
      carbsGrams = Math.round((dailyCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);
    }

    // Update user's nutrition requirements
    user.nutritionRequirements = {
      dailyCalories,
      macros: {
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams
      },
      lastCalculated: new Date()
    };

    await user.save();

    res.json({
      message: 'Nutrition requirements calculated and saved successfully',
      requirements: user.nutritionRequirements
    });

  } catch (error) {
    console.error('Error calculating nutrition requirements:', error);
    res.status(500).json({ message: 'Server error calculating nutrition requirements' });
  }
});

// Get user's current nutrition requirements
const getNutritionRequirements = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.nutritionRequirements) {
      return res.status(404).json({ message: 'Nutrition requirements not found' });
    }

    res.json(user.nutritionRequirements);
  } catch (error) {
    console.error('Error fetching nutrition requirements:', error);
    res.status(500).json({ message: 'Server error fetching nutrition requirements' });
  }
});

module.exports = {
  getDailyNutrition,
  getNutritionCalculations,
  updateMacros,
  resetMacros,
  calculateNutritionRequirements,
  getNutritionRequirements
};

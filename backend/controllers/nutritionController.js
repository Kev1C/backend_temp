// backend/controllers/nutritionController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Meal = require('../models/Meal');

// Optimized cache implementation with Map
const nutritionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

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

// Utility function to generate cache key
const generateCacheKey = (userId, date) => `nutrition:${userId}:${date}`;

// Utility function to manage cache entries
const setCacheWithTTL = (key, value) => {
  if (nutritionCache.has(key)) {
    clearTimeout(nutritionCache.get(key).timeout);
  }
  const timeout = setTimeout(() => nutritionCache.delete(key), CACHE_TTL);
  nutritionCache.set(key, { value, timeout });
};

const getCacheValue = (key) => {
  const entry = nutritionCache.get(key);
  return entry ? entry.value : null;
};

// Utility function to parse date
const parseDateRange = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(year, month - 1, day);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

// @desc    Get daily nutrition data
// @route   GET /api/nutrition/daily/:date
// @access  Private
const getDailyNutrition = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const userId = req.user.userId || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  const cacheKey = generateCacheKey(userId, date);
  const cachedData = getCacheValue(cacheKey);

  if (cachedData) {
    const etag = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(cachedData))
      .digest('hex');
    
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    
    res.set('ETag', etag);
    return res.json(cachedData);
  }

  const { startDate, endDate } = parseDateRange(date);

  try {
    // Optimized aggregation pipeline with index hints
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalCalories: { $sum: "$calories" },
          totalProtein: { $sum: "$protein" },
          totalCarbs: { $sum: "$carbs" },
          totalFats: { $sum: "$fats" },
          meals: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 0,
          totalCalories: 1,
          totalProtein: 1,
          totalCarbs: 1,
          totalFats: 1,
          meals: {
            $map: {
              input: "$meals",
              as: "meal",
              in: {
                _id: "$$meal._id",
                name: "$$meal.name",
                image: "$$meal.image",
                calories: "$$meal.calories",
                protein: "$$meal.protein",
                carbs: "$$meal.carbs",
                fats: "$$meal.fats",
                time: "$$meal.time",
                createdAt: "$$meal.createdAt"
              }
            }
          }
        }
      }
    ];

    const result = await Meal.aggregate(pipeline);
    const dailyData = result[0] || {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      meals: []
    };

    setCacheWithTTL(cacheKey, dailyData);
    res.json(dailyData);
  } catch (error) {
    console.error('Error in getDailyNutrition:', error);
    res.status(500).json({ message: 'Error fetching nutrition data', error: error.message });
  }
});

// @desc    Update daily nutrition data
// @route   POST /api/nutrition/daily/:date
// @access  Private
const updateDailyNutrition = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { meal } = req.body;
  const userId = req.user.userId || req.user._id;
  const { startDate } = parseDateRange(date);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Save the new meal
      const newMeal = new Meal({
        userId: new mongoose.Types.ObjectId(userId),
        ...meal,
        date: startDate
      });
      await newMeal.save({ session });

      // Invalidate cache
      const cacheKey = generateCacheKey(userId, date);
      if (nutritionCache.has(cacheKey)) {
        clearTimeout(nutritionCache.get(cacheKey).timeout);
        nutritionCache.delete(cacheKey);
      }
    });

    res.status(201).json({ message: 'Nutrition data updated successfully' });
  } catch (error) {
    console.error('Error in updateDailyNutrition:', error);
    res.status(500).json({ message: 'Error updating nutrition data' });
  } finally {
    session.endSession();
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
  const fats = weightInKg * 0.8; // g/kg
  const remainingCalories = targetCalories - (protein * 4) - (fats * 9);
  const carbs = Math.max(0, remainingCalories / 4);

  // Match frontend expected structure
  const calculations = {
    calories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats)
  };

  res.json(calculations);
});

// @desc    Update daily macros
// @route   POST /api/nutrition/macros
// @access  Private
const updateMacros = asyncHandler(async (req, res) => {
  const { calories, protein, carbs, fats } = req.body;
  const userId = req.user.userId || req.user._id;

  // Store in cache with user-specific key
  const cacheKey = `macros-${userId}`;
  const macroData = { calories, protein, carbs, fats, lastUpdated: new Date() };
  setCacheWithTTL(cacheKey, macroData);

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
    fats: 0,
    lastUpdated: new Date()
  };
  
  setCacheWithTTL(cacheKey, resetData);

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
  let proteinRatio, carbsRatio, fatsRatio;

  switch (fitnessGoal) {
    case 'lose_weight':
      calories = tdee - 500; // 500 calorie deficit
      proteinRatio = 0.35; // Higher protein for muscle preservation
      carbsRatio = 0.35;
      fatsRatio = 0.30;
      break;
    case 'get_fitter':
      calories = tdee;
      proteinRatio = 0.30;
      carbsRatio = 0.40;
      fatsRatio = 0.30;
      break;
    case 'gain_muscle':
      calories = tdee + 300; // Caloric surplus for muscle gain
      proteinRatio = 0.30;
      carbsRatio = 0.45;
      fatsRatio = 0.25;
      break;
    default:
      calories = tdee;
      proteinRatio = 0.30;
      carbsRatio = 0.40;
      fatsRatio = 0.30;
  }

  // Calculate macros in grams
  const protein = Math.round((calories * proteinRatio) / 4); // 4 calories per gram of protein
  const carbs = Math.round((calories * carbsRatio) / 4);     // 4 calories per gram of carbs
  const fats = Math.round((calories * fatsRatio) / 9);         // 9 calories per gram of fats

  const nutritionalNeeds = {
    calories: Math.round(calories),
    protein,
    carbs,
    fats
  };

  res.status(200).json(nutritionalNeeds);
});

module.exports = {
  getDailyNutrition,
  updateDailyNutrition,
  getNutritionCalculations,
  updateMacros,
  resetMacros,
  calculateNutritionalNeeds
};

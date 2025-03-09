// backend/controllers/nutritionController.js

const Meal = require("../models/Meal");
const User = require("../models/User");
const DailyNutrition = require("../models/DailyNutrition");
const connectDB = require("../../supabase/functions/api/config/db");
const crypto = require("crypto");

// Define asyncHandler since it's no longer imported
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Optimized cache implementation with Map
const nutritionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Activity level multipliers
const ACTIVITY_MULTIPLIERS = {
  "sedentary": 1.2,
  "lightly_active": 1.375,
  "moderately_active": 1.55,
  "very_active": 1.725,
};

// Age ranges average values
const AGE_RANGES = {
  "18_24": 21,
  "25_34": 29,
  "35_44": 39,
  "45_54": 49,
  "55_64": 59,
  "65_plus": 70,
};

// Utility function to generate cache key
const generateCacheKey = (userId, date) => `nutrition:${userId}:${date}`;

// Utility function to manage cache entries
const setCacheWithTTL = (key, value) => {
  if (nutritionCache.has(key)) {
    clearTimeout(nutritionCache.get(key).timeout);
  }
  const timeout = setTimeout(() => nutritionCache.delete(key), CACHE_TTL);
  nutritionCache.set(key, {value, timeout});
};

// Utility function to get cached value
const getCacheValue = (key) => {
  const entry = nutritionCache.get(key);
  return entry ? entry.value : null;
};

// Utility function to parse date
const parseDateRange = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const startDate = new Date(year, month - 1, day);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(year, month - 1, day);
  endDate.setHours(23, 59, 59, 999);
  return {startDate, endDate};
};

// @desc    Get daily nutrition data
// @route   GET /api/nutrition/daily/:date
// @access  Private
const getDailyNutrition = asyncHandler(async (req, res) => {
  const {date} = req.params;
  const userId = req.user.userId || req.user.id;

  // Check cache first
  const cacheKey = generateCacheKey(userId, date);
  const cachedData = getCacheValue(cacheKey);

  if (cachedData) {
    const etag = crypto
        .createHash("md5")
        .update(JSON.stringify(cachedData))
        .digest("hex");

    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    res.set("ETag", etag);
    return res.json(cachedData);
  }

  const {startDate, endDate} = parseDateRange(date);
  
  try {
    // Get meals for the day
    const meals = await Meal.findByUser(userId, {
      startDate,
      endDate,
      sort: { field: 'time', ascending: true }
    });
    
    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    meals.forEach(meal => {
      totalCalories += meal.calories || 0;
      totalProtein += meal.protein || 0;
      totalCarbs += meal.carbs || 0;
      totalFats += meal.fats || 0;
    });
    
    const result = {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFats,
      meals: meals
    };

    // Cache the result
    setCacheWithTTL(cacheKey, result);

    // Set ETag for the new data
    const etag = crypto
        .createHash("md5")
        .update(JSON.stringify(result))
        .digest("hex");
    res.set("ETag", etag);

    res.json(result);
  } catch (error) {
    console.error("Error getting daily nutrition:", error);
    res.status(500).json({ message: "Error retrieving nutrition data" });
  }
});

// @desc    Update daily nutrition data
// @route   POST /api/nutrition/daily/:date
// @access  Private
const updateDailyNutrition = asyncHandler(async (req, res) => {
  const {date} = req.params;
  const {meal} = req.body;
  const userId = req.user.userId || req.user.id;

  const {startDate} = parseDateRange(date);
  const formattedDate = startDate.toISOString().split('T')[0];

  try {
    const supabase = await connectDB();
    
    // Start a transaction using Supabase's built-in transaction support
    const { data: newMeal, error: mealError } = await supabase.rpc('add_meal_with_nutrition', {
      p_user_id: userId,
      p_name: meal.name,
      p_image: meal.image,
      p_calories: meal.calories,
      p_carbs: meal.carbs,
      p_protein: meal.protein,
      p_fats: meal.fats,
      p_time: meal.time || new Date().toISOString(),
      p_date: formattedDate
    });
    
    if (mealError) {
      console.error("Error adding meal:", mealError);
      return res.status(500).json({ message: "Error adding meal", error: mealError.message });
    }

    // Invalidate cache
    const cacheKey = generateCacheKey(userId, date);
    if (nutritionCache.has(cacheKey)) {
      clearTimeout(nutritionCache.get(cacheKey).timeout);
      nutritionCache.delete(cacheKey);
    }

    res.status(201).json({
      message: "Meal added and nutrition data updated!",
      mealId: newMeal?.id
    });
  } catch (error) {
    console.error("Error in updateDailyNutrition:", error);
    res.status(500).json({message: "Error updating nutrition data"});
  }
});

// @desc    Get nutrition calculations based on user data
// @route   GET /api/nutrition/calculations
// @access  Private
const getNutritionCalculations = asyncHandler(async (req, res) => {
  const {gender, weight, height, fitnessGoal} = req.query;

  // Basic validation
  if (!gender || !weight || !height || !fitnessGoal) {
    return res.status(400).json({
      message: "Missing required parameters: gender, weight, height, fitnessGoal",
    });
  }

  // Calculate BMR using Harris-Benedict equation
  let bmr;
  const weightInKg = parseFloat(weight);
  const heightInCm = parseFloat(height);

  if (gender === "male") {
    bmr = 88.362 + (13.397 * weightInKg) + (4.799 * heightInCm) - (5.677 * 25);
  } else {
    bmr = 447.593 + (9.247 * weightInKg) + (3.098 * heightInCm) - (4.330 * 25);
  }

  // Adjust calories based on fitness goal
  let targetCalories = bmr;
  switch (fitnessGoal) {
    case "lose_weight":
      targetCalories *= 0.85; // 15% deficit
      break;
    case "gain_muscle":
      targetCalories *= 1.15; // 15% surplus
      break;
    default:
      // maintain weight
      break;
  }

  // Calculate macros
  const protein = weightInKg * (fitnessGoal === "gain_muscle" ? 2.2 : 2.0); // g/kg
  const fats = weightInKg * 0.8; // g/kg
  const remainingCalories = targetCalories - (protein * 4) - (fats * 9);
  const carbs = Math.max(0, remainingCalories / 4);

  // Match frontend expected structure
  const calculations = {
    calories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
  };

  res.json(calculations);
});

// @desc    Update daily macros
// @route   POST /api/nutrition/macros
// @access  Private
const updateMacros = asyncHandler(async (req, res) => {
  const {calories, protein, carbs, fats} = req.body;
  const userId = req.user.userId || req.user.id;

  // Store in cache with user-specific key
  const cacheKey = `macros-${userId}`;
  const macroData = {calories, protein, carbs, fats, lastUpdated: new Date()};
  setCacheWithTTL(cacheKey, macroData);

  res.json(macroData);
});

// @desc    Reset daily macros
// @route   POST /api/nutrition/macros/reset
// @access  Private
const resetMacros = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const cacheKey = `macros-${userId}`;

  // Reset to zero
  const resetData = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    lastUpdated: new Date(),
  };

  setCacheWithTTL(cacheKey, resetData);

  res.json(resetData);
});

// @desc    Calculate user's daily nutritional needs
// @route   POST /api/nutrition/calculate
// @access  Private
const calculateNutritionalNeeds = asyncHandler(async (req, res) => {
  const {gender, ageRange, height, weight, activityLevel, fitnessGoal} = req.body;

  // Basic validation
  if (!gender || !ageRange || !height || !weight || !activityLevel || !fitnessGoal) {
    return res.status(400).json({
      message: "Missing required parameters",
    });
  }

  // Get average age for the range
  const age = AGE_RANGES[ageRange] || 30;

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr;
  if (gender.toLowerCase() === "male") {
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
  let proteinRatio; let carbsRatio; let fatsRatio;

  switch (fitnessGoal) {
    case "lose_weight":
      calories = tdee - 500; // 500 calorie deficit
      proteinRatio = 0.35; // Higher protein for muscle preservation
      carbsRatio = 0.35;
      fatsRatio = 0.30;
      break;
    case "get_fitter":
      calories = tdee;
      proteinRatio = 0.30;
      carbsRatio = 0.40;
      fatsRatio = 0.30;
      break;
    case "gain_muscle":
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
  const carbs = Math.round((calories * carbsRatio) / 4); // 4 calories per gram of carbs
  const fats = Math.round((calories * fatsRatio) / 9); // 9 calories per gram of fats

  const nutritionalNeeds = {
    calories: Math.round(calories),
    protein,
    carbs,
    fats,
  };

  res.status(200).json(nutritionalNeeds);
});

// Helper function to get user's nutritional goals
const getNutritionalGoals = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Get the latest nutritional goals from the user's daily nutrition
  const latestNutrition = await DailyNutrition.findByUserAndDate(
    userId, 
    new Date().toISOString().split('T')[0]
  );

  // If no goals are set, calculate default goals
  if (!latestNutrition) {
    const gender = user.gender;
    const weight = user.weight;
    const height = user.height;
    const fitnessGoal = user.fitnessGoal;

    // Calculate BMR using Harris-Benedict equation
    let bmr;
    if (gender === "male") {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * 25);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * 25);
    }

    // Adjust calories based on fitness goal
    let calorieMultiplier = 1.2; // Default to maintenance
    if (fitnessGoal === "lose_weight") {
      calorieMultiplier = 0.8;
    } else if (fitnessGoal === "gain_muscle") {
      calorieMultiplier = 1.4;
    }

    const calories = Math.round(bmr * calorieMultiplier);

    return {
      calories,
      protein: Math.round(weight * 2), // 2g per kg of body weight
      carbs: Math.round((calories * 0.4) / 4), // 40% of calories from carbs
      fats: Math.round((calories * 0.25) / 9), // 25% of calories from fats
    };
  }

  return {
    calories: latestNutrition.calories,
    protein: latestNutrition.protein,
    carbs: latestNutrition.carbs,
    fats: latestNutrition.fats
  };
};

// @desc    Get nutrition completion data for heatmap
// @route   GET /api/nutrition/heatmap
// @access  Private
const getNutritionHeatmapData = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const {startDate, endDate} = req.query;

  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({message: "Invalid date format"});
    }

    // Set time to start/end of day
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    // Check cache first
    const cacheKey = generateCacheKey(userId, `heatmap:${start.toISOString().split("T")[0]}-${end.toISOString().split("T")[0]}`);
    const cachedData = getCacheValue(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Get all meals in date range
    const mealsData = await Meal.findByUser(userId, {
      startDate: start,
      endDate: end
    });

    // Format data by day
    const formattedData = {};
    
    // Group meals by day and calculate totals
    for (const meal of mealsData) {
      const dateStr = new Date(meal.date).toISOString().split('T')[0];
      
      if (!formattedData[dateStr]) {
        formattedData[dateStr] = {
          value: 0,
          goalMet: false
        };
      }
      
      formattedData[dateStr].value += meal.calories;
    }
    
    // Get user's calorie goals to determine if goals were met
    const goals = await getNutritionalGoals(userId);
    
    // Update goal met status
    for (const dateStr in formattedData) {
      formattedData[dateStr].value = Math.round(formattedData[dateStr].value);
      formattedData[dateStr].goalMet = formattedData[dateStr].value >= goals.calories;
    }

    // Cache the results
    setCacheWithTTL(cacheKey, formattedData);

    res.json(formattedData);
  } catch (error) {
    console.error("Heatmap data error:", error);
    res.status(500).json({message: "Error fetching heatmap data", error: error.message});
  }
});

// @desc    Get monthly nutrition data
// @route   GET /api/nutrition/monthly/:year/:month
// @access  Private
const getMonthlyNutrition = asyncHandler(async (req, res) => {
  const {year, month} = req.params;
  const userId = req.user.userId || req.user.id;

  // Calculate start and end dates for the month
  const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1)); // month is 0-based
  const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)); // Last day of the month

  const cacheKey = `monthly:${userId}:${year}-${month}`;
  const cachedData = getCacheValue(cacheKey);

  if (cachedData) {
    const etag = crypto
        .createHash("md5")
        .update(JSON.stringify(cachedData))
        .digest("hex");

    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    res.set("ETag", etag);
    return res.json(cachedData);
  }

  try {
    // Get all meals for the month
    const meals = await Meal.findByUser(userId, {
      startDate, 
      endDate
    });
    
    // Process the data to get monthly stats
    const dailyData = {};
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalMeals = 0;
    
    // Group meals by day
    for (const meal of meals) {
      const day = new Date(meal.date).getUTCDate();
      
      if (!dailyData[day]) {
        dailyData[day] = {
          day,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          mealCount: 0
        };
      }
      
      // Add to daily totals
      dailyData[day].calories += meal.calories;
      dailyData[day].protein += meal.protein;
      dailyData[day].carbs += meal.carbs;
      dailyData[day].fats += meal.fats;
      dailyData[day].mealCount += 1;
      
      // Add to monthly totals
      totalCalories += meal.calories;
      totalProtein += meal.protein;
      totalCarbs += meal.carbs;
      totalFats += meal.fats;
      totalMeals += 1;
    }
    
    // Convert dailyData object to array
    const daysTracked = Object.keys(dailyData).length;
    const dailyBreakdown = Object.values(dailyData);
    
    const result = {
      year: parseInt(year),
      month: parseInt(month),
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      totalMeals,
      daysTracked,
      averageCalories: daysTracked > 0 ? totalCalories / daysTracked : 0,
      averageProtein: daysTracked > 0 ? totalProtein / daysTracked : 0,
      averageCarbs: daysTracked > 0 ? totalCarbs / daysTracked : 0,
      averageFats: daysTracked > 0 ? totalFats / daysTracked : 0,
      averageMealsPerDay: daysTracked > 0 ? totalMeals / daysTracked : 0,
      dailyBreakdown
    };

    // Add goals comparison
    try {
      const goals = await getNutritionalGoals(userId);
      result.goals = goals;
      result.monthlyGoals = {
        calories: goals.calories * result.daysTracked,
        protein: goals.protein * result.daysTracked,
        carbs: goals.carbs * result.daysTracked,
        fats: goals.fats * result.daysTracked,
      };

      // Calculate completion percentages based on daily averages
      result.completion = {
        calories: goals.calories > 0 ? (result.averageCalories / goals.calories) * 100 : 0,
        protein: goals.protein > 0 ? (result.averageProtein / goals.protein) * 100 : 0,
        carbs: goals.carbs > 0 ? (result.averageCarbs / goals.carbs) * 100 : 0,
        fats: goals.fats > 0 ? (result.averageFats / goals.fats) * 100 : 0,
      };
    } catch (error) {
      console.error("Error fetching nutritional goals:", error);
    }

    // Cache the result
    setCacheWithTTL(cacheKey, result);

    // Set ETag for the new data
    const etag = crypto
        .createHash("md5")
        .update(JSON.stringify(result))
        .digest("hex");
    res.set("ETag", etag);

    res.json(result);
  } catch (error) {
    console.error("Error fetching monthly nutrition data:", error);
    res.status(500).json({message: "Server error"});
  }
});

module.exports = {
  getDailyNutrition,
  updateDailyNutrition,
  getNutritionCalculations,
  updateMacros,
  resetMacros,
  calculateNutritionalNeeds,
  getNutritionHeatmapData,
  getMonthlyNutrition,
};

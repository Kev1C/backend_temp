// backend/controllers/nutritionController.js
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Meal = require("../models/Meal");
const User = require("../models/User"); // Import User model
const DailyNutrition = require("../models/DailyNutrition"); // Import DailyNutrition model

// Optimized cache implementation with Map (from notworking)
const nutritionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Activity level multipliers (from notworking)
const ACTIVITY_MULTIPLIERS = {
  "sedentary": 1.2,
  "lightly_active": 1.375,
  "moderately_active": 1.55,
  "very_active": 1.725,
};

// Age ranges average values (from notworking)
const AGE_RANGES = {
  "18_24": 21,
  "25_34": 29,
  "35_44": 39,
  "45_54": 49,
  "55_64": 59,
  "65_plus": 70,
};

// Utility function to generate cache key (from notworking)
const generateCacheKey = (userId, date) => `nutrition:${userId}:${date}`;

// Utility function to manage cache entries (from notworking)
const setCacheWithTTL = (key, value) => {
  if (nutritionCache.has(key)) {
    clearTimeout(nutritionCache.get(key).timeout);
  }
  const timeout = setTimeout(() => nutritionCache.delete(key), CACHE_TTL);
  nutritionCache.set(key, {value, timeout});
};

// Utility function to get cached value (from notworking)
const getCacheValue = (key) => {
  const entry = nutritionCache.get(key);
  return entry ? entry.value : null;
};

// Utility function to parse date (from notworking)
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
  const userId = req.user.userId || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({message: "Invalid user ID format"});
  }

  // Check cache first (from notworking)
  const cacheKey = generateCacheKey(userId, date);
  const cachedData = getCacheValue(cacheKey);

  if (cachedData) {
    const etag = require("crypto")
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

  // Optimized aggregation pipeline with index hints (from notworking)
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalCalories: {$sum: "$calories"},
        totalProtein: {$sum: "$protein"},
        totalCarbs: {$sum: "$carbs"},
        totalFats: {$sum: "$fats"},
        meals: {
          $push: {
            id: "$_id",
            name: "$name",
            calories: "$calories",
            protein: "$protein",
            carbs: "$carbs",
            fats: "$fats",
            image: "$image",
            time: "$time",
            date: "$date",
          },
        },
      },
    },
  ];

  const [aggregateResult] = await Meal.aggregate(pipeline)
      .hint({userId: 1, date: 1}) // Index hint (from notworking)
      .exec();

  const result = aggregateResult ? {
    calories: aggregateResult.totalCalories,
    protein: aggregateResult.totalProtein,
    carbs: aggregateResult.totalCarbs,
    fats: aggregateResult.totalFats,
    meals: aggregateResult.meals,
  } : {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    meals: [],
  };

  // Cache the result (from notworking)
  setCacheWithTTL(cacheKey, result);

  // Set ETag for the new data (from notworking)
  const etag = require("crypto")
      .createHash("md5")
      .update(JSON.stringify(result))
      .digest("hex");
  res.set("ETag", etag);

  res.json(result);
});

// @desc    Update daily nutrition data
// @route   POST /api/nutrition/daily/:date
// @access  Private
const updateDailyNutrition = asyncHandler(async (req, res) => {
  const {date} = req.params;
  const {meal} = req.body;
  const userId = req.user.userId || req.user._id;

  // Declare startDate and endDate
  const {startDate, endDate} = parseDateRange(date);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Save the new meal
      const newMeal = new Meal({
        userId: new mongoose.Types.ObjectId(userId),
        ...meal,
        date: startDate,
      });
      await newMeal.save({session});

      // Invalidate cache
      const cacheKey = generateCacheKey(userId, date);
      if (nutritionCache.has(cacheKey)) {
        clearTimeout(nutritionCache.get(cacheKey).timeout);
        nutritionCache.delete(cacheKey);
      }

      // Fetch updated data within the transaction
      const updatedMeals = await Meal.find({
        userId,
        date: {$gte: startDate, $lte: endDate},
      }).session(session).sort({date: 1}); // Added .session(session)

      const aggregateResult = await Meal.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            date: {$gte: startDate, $lte: endDate},
          },
        },
        {
          $group: {
            _id: null,
            totalCalories: {$sum: "$calories"},
            totalProtein: {$sum: "$protein"},
            totalCarbs: {$sum: "$carbs"},
            totalFats: {$sum: "$fats"},
            meals: {$push: "$$ROOT"},
          },
        },
      ]).session(session); // Added .session(session)

      const result = aggregateResult[0] ? {
        calories: aggregateResult[0].totalCalories,
        protein: aggregateResult[0].totalProtein,
        carbs: aggregateResult[0].totalCarbs,
        fats: aggregateResult[0].totalFats,
        meals: updatedMeals,
      } : {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        meals: updatedMeals,
      };

      // Update cache with fresh data (moved inside the transaction block)
      setCacheWithTTL(cacheKey, result);
    }); // End of transaction block

    res.status(201).json({message: "Meal added and nutrition data updated!"});
  } catch (error) {
    console.error("Error in updateDailyNutrition:", error);
    res.status(500).json({message: "Error updating nutrition data"});
  } finally {
    session.endSession();
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
  const userId = req.user.userId || req.user._id;

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
  const userId = req.user.userId || req.user._id;
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

// Helper function to get user's nutritional goals (from notworking)
const getNutritionalGoals = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Get the latest nutritional goals from the user's daily nutrition
  const latestNutrition = await DailyNutrition.findOne({userId})
      .sort({date: -1})
      .select("calories protein carbs fats")
      .lean();

  // If no goals are set, calculate default goals
  if (!latestNutrition) {
    const {gender, weight, height, fitnessGoal} = user;

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

  return latestNutrition;
};

// @desc    Get nutrition completion data for heatmap
// @route   GET /api/nutrition/heatmap
// @access  Private (from notworking)
const getNutritionHeatmapData = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;
  const {startDate, endDate} = req.query;

  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({message: "Invalid date format"});
    }

    // Set time to start/end of day in UTC
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    // Check cache first
    const cacheKey = generateCacheKey(userId, `heatmap:${start.toISOString().split("T")[0]}-${end.toISOString().split("T")[0]}`);
    const cachedData = getCacheValue(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Use aggregation pipeline for better performance
    const data = await Meal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$date",
          totalCalories: {$sum: "$calories"},
        },
      },
      {
        $lookup: {
          from: "dailynutritions",
          let: {userId: "$userId", date: "$_id"},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$eq: ["$userId", "$$userId"]},
                    {$eq: ["$date", "$$date"]},
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                calorieGoal: "$calories",
              },
            },
          ],
          as: "dailyGoal",
        },
      },
      {
        $unwind: {
          path: "$dailyGoal",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          value: "$totalCalories",
          goalMet: {
            $gte: ["$totalCalories", {$ifNull: ["$dailyGoal.calorieGoal", 0]}],
          },
        },
      },
    ]).exec();

    const formattedData = data.reduce((acc, item) => {
      const dateStr = item.date.toISOString().split("T")[0];
      acc[dateStr] = {
        value: Math.round(item.value), // Round calories to whole numbers
        goalMet: item.goalMet,
      };
      return acc;
    }, {});

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
  const userId = req.user.userId || req.user._id;

  // console.log(`Fetching monthly nutrition for user: ${userId}, year: ${year}, month: ${month}`);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error("Invalid user ID format");
    return res.status(400).json({message: "Invalid user ID format"});
  }

  // Calculate start and end dates for the month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1)); // month is 0-based
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // Last day of the month

  // console.log('Start Date (UTC):', startDate);
  // console.log('End Date (UTC):', endDate);

  const cacheKey = `monthly:${userId}:${year}-${month}`;
  const cachedData = getCacheValue(cacheKey);

  if (cachedData) {
    // console.log('Returning cached data for key:', cacheKey);
    const etag = require("crypto")
        .createHash("md5")
        .update(JSON.stringify(cachedData))
        .digest("hex");

    if (req.headers["if-none-match"] === etag) {
      console.log("ETag match, returning 304");
      return res.status(304).end();
    }

    res.set("ETag", etag);
    return res.json(cachedData);
  }

  // Aggregate monthly data
  let monthlyData;
  try {
    monthlyData = await Meal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {$year: "$date"},
            month: {$month: "$date"},
            day: {$dayOfMonth: "$date"},
          },
          dailyCalories: {$sum: "$calories"},
          dailyProtein: {$sum: "$protein"},
          dailyCarbs: {$sum: "$carbs"},
          dailyFats: {$sum: "$fats"},
          mealCount: {$sum: 1},
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month",
          },
          totalCalories: {$sum: "$dailyCalories"},
          totalProtein: {$sum: "$dailyProtein"},
          totalCarbs: {$sum: "$dailyCarbs"},
          totalFats: {$sum: "$dailyFats"},
          totalMeals: {$sum: "$mealCount"},
          daysTracked: {$addToSet: "$_id.day"}, // Use $addToSet to get unique days
          dailyAverages: {
            $push: {
              day: "$_id.day",
              calories: "$dailyCalories",
              protein: "$dailyProtein",
              carbs: "$dailyCarbs",
              fats: "$dailyFats",
              mealCount: "$mealCount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalCalories: 1,
          totalProtein: 1,
          totalCarbs: 1,
          totalFats: 1,
          totalMeals: 1,
          daysTracked: {$size: "$daysTracked"}, // Count the unique days
          averageCalories: {$divide: ["$totalCalories", {$size: "$daysTracked"}]},
          averageProtein: {$divide: ["$totalProtein", {$size: "$daysTracked"}]},
          averageCarbs: {$divide: ["$totalCarbs", {$size: "$daysTracked"}]},
          averageFats: {$divide: ["$totalFats", {$size: "$daysTracked"}]},
          averageMealsPerDay: {$divide: ["$totalMeals", {$size: "$daysTracked"}]},
          dailyBreakdown: "$dailyAverages",
        },
      },
    ]).hint({userId: 1, date: 1});

    // console.log('Aggregation result:', JSON.stringify(monthlyData, null, 2));
  } catch (error) {
    console.error("Error during aggregation:", error);
    return res.status(500).json({message: "Error during data aggregation"});
  }

  const result = monthlyData[0] || {
    year: parseInt(year),
    month: parseInt(month),
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    totalMeals: 0,
    daysTracked: 0,
    averageCalories: 0,
    averageProtein: 0,
    averageCarbs: 0,
    averageFats: 0,
    averageMealsPerDay: 0,
    dailyBreakdown: [],
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
  // console.log('Caching data for key:', cacheKey);

  // Set ETag for the new data
  const etag = require("crypto")
      .createHash("md5")
      .update(JSON.stringify(result))
      .digest("hex");
  res.set("ETag", etag);

  // console.log('Returning data:', JSON.stringify(result, null, 2));
  res.json(result);
});

module.exports = {
  getDailyNutrition,
  updateDailyNutrition,
  getNutritionCalculations,
  updateMacros,
  resetMacros,
  calculateNutritionalNeeds,
  getNutritionHeatmapData, // From notworking
  getMonthlyNutrition, // Modified from notworking
};

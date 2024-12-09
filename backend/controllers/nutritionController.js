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

module.exports = {
  getDailyNutrition
};

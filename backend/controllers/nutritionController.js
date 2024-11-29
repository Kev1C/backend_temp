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
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Check cache first
    const cacheKey = `${userId}-${date}`;
    if (nutritionCache.has(cacheKey)) {
      return res.json(nutritionCache.get(cacheKey));
    }

    // Create UTC date range for the given local date
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day));
    const endDate = new Date(Date.UTC(year, month - 1, day + 1));

    // Simplified query without heavy aggregation for better performance
    const meals = await Meal.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).lean();

    // Calculate totals in memory (faster than MongoDB aggregation for small datasets)
    const result = meals.reduce((acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.carbs += meal.carbs || 0;
      acc.fat += meal.fats || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Add formatted meals to result
    result.meals = meals.map(meal => ({
      id: meal._id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fats,
      image: meal.image,
      time: meal.time,
      date: meal.date
    }));

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

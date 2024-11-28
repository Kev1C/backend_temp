// backend/controllers/nutritionController.js
const asyncHandler = require('express-async-handler');
const Meal = require('../models/Meal');

// @desc    Get daily nutrition data
// @route   GET /api/nutrition/daily/:date
// @access  Private
const getDailyNutrition = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const userId = req.user.userId; // Updated to match auth middleware

  // Get all meals for the specified date
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const meals = await Meal.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });

  // Calculate total nutrition for the day
  const dailyNutrition = meals.reduce((acc, meal) => {
    return {
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fats || 0), // Note: frontend uses 'fat', backend uses 'fats'
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Return both the totals and the meals
  res.json({
    ...dailyNutrition,
    meals: meals.map(meal => ({
      id: meal._id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fats,
      image: meal.image,
      time: meal.time,
      date: meal.date
    }))
  });
});

module.exports = {
  getDailyNutrition,
};

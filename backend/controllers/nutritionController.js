// backend/controllers/nutritionController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Meal = require('../models/Meal');

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

    // Create UTC date range for the given local date
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day));
    const endDate = new Date(Date.UTC(year, month - 1, day + 1));

    // Using aggregation pipeline for better performance
    const result = await Meal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          calories: { $sum: '$calories' },
          protein: { $sum: '$protein' },
          carbs: { $sum: '$carbs' },
          fat: { $sum: '$fats' },
          meals: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          calories: 1,
          protein: 1,
          carbs: 1,
          fat: 1,
          meals: {
            $map: {
              input: '$meals',
              as: 'meal',
              in: {
                id: '$$meal._id',
                name: '$$meal.name',
                calories: '$$meal.calories',
                protein: '$$meal.protein',
                carbs: '$$meal.carbs',
                fat: '$$meal.fats',
                image: '$$meal.image',
                time: '$$meal.time',
                date: '$$meal.date'
              }
            }
          }
        }
      }
    ]);

    // Handle case when no meals are found
    if (!result || result.length === 0) {
      return res.json({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: []
      });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error in getDailyNutrition:', error);
    res.status(500).json({ message: error.message || 'Error retrieving nutrition data' });
  }
});

module.exports = {
  getDailyNutrition
};

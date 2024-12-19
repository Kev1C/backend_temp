// backend/routes/nutritionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getDailyNutrition, 
  getNutritionCalculations,
  updateDailyNutrition,
  updateMacros,
  resetMacros,
  calculateNutritionalNeeds
} = require('../controllers/nutritionController');
const Meal = require('../models/Meal');
const DailyNutrition = require('../models/DailyNutrition');

// Get daily nutrition
router.get('/daily/:date', auth, getDailyNutrition);

// Update daily nutrition
router.post('/daily/:date', auth, updateDailyNutrition);

// Get nutrition calculations
router.get('/calculations', auth, getNutritionCalculations);

// Update macros
router.post('/macros', auth, updateMacros);

// Reset macros
router.post('/macros/reset', auth, resetMacros);

// Calculate nutritional needs
router.post('/calculate', auth, calculateNutritionalNeeds);

// Save meal and update daily nutrition
router.post('/meals', auth, async (req, res) => {
  try {
    const { name, image, calories, carbs, protein, fats, time } = req.body;
    const userId = req.user.id;
    
    // Validate that image path exists
    if (!image || !image.startsWith('file://')) {
      return res.status(400).json({ message: 'Invalid image path. Image must be stored locally.' });
    }

    // Start a session for transaction
    const session = await Meal.startSession();
    let savedMeal;
    
    try {
      await session.withTransaction(async () => {
        // Create new meal entry with local image path
        savedMeal = await Meal.create([{
          userId,
          name,
          image,
          calories,
          carbs,
          protein,
          fats,
          time
        }], { session });

        // Update daily nutrition totals
        await DailyNutrition.findOneAndUpdate(
          { userId, date: new Date() },
          {
            $inc: {
              totalCalories: calories,
              totalProtein: protein,
              totalCarbs: carbs,
              totalFats: fats
            }
          },
          { upsert: true, new: true, session }
        );
      });

      await session.endSession();
      res.status(201).json(savedMeal[0]);
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error saving meal:', error);
    res.status(500).json({ message: 'Error saving meal data' });
  }
});

module.exports = router;

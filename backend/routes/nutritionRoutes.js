// backend/routes/nutritionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getDailyNutrition, 
  getNutritionCalculations,
  updateMacros,
  resetMacros,
  calculateNutritionalNeeds
} = require('../controllers/nutritionController');
const Meal = require('../models/Meal');
const DailyNutrition = require('../models/DailyNutrition');

// Get daily nutrition
router.get('/daily/:date', auth, getDailyNutrition);

// Update daily nutrition
router.post('/daily/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.userId || req.user._id;
    const { calories, carbs, protein, fats } = req.body;
    
    // Create date range for the given local date
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day);
    endDate.setHours(23, 59, 59, 999);

    // Find or create daily nutrition
    let dailyNutrition = await DailyNutrition.findOne({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    if (!dailyNutrition) {
      dailyNutrition = new DailyNutrition({
        userId,
        date: startDate,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      });
    }

    // Update nutrition totals
    dailyNutrition.calories = Number(dailyNutrition.calories || 0) + Number(calories || 0);
    dailyNutrition.protein = Number(dailyNutrition.protein || 0) + Number(protein || 0);
    dailyNutrition.carbs = Number(dailyNutrition.carbs || 0) + Number(carbs || 0);
    dailyNutrition.fat = Number(dailyNutrition.fat || 0) + Number(fats || 0);

    await dailyNutrition.save();

    res.status(200).json(dailyNutrition);
  } catch (error) {
    console.error('Error updating daily nutrition:', error);
    res.status(500).json({ message: error.message || 'Error updating daily nutrition' });
  }
});

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
    const { name, image, calories, carbs, protein, fats, time, date } = req.body;
    const userId = req.user.id;
    const mealDate = new Date(date);
    
    // Start a session for transaction
    const session = await Meal.startSession();
    let savedMeal;
    
    try {
      await session.withTransaction(async () => {
        // Create new meal entry
        savedMeal = await Meal.create([{
          userId,
          name,
          image,
          calories,
          carbs,
          protein,
          fats,
          time,
          date: mealDate
        }], { session });
        
        // Update or create daily nutrition
        await DailyNutrition.findOneAndUpdate(
          { 
            userId, 
            date: {
              $gte: new Date(mealDate.setHours(0, 0, 0, 0)),
              $lt: new Date(mealDate.setHours(23, 59, 59, 999))
            }
          },
          {
            $inc: {
              calories,
              carbs,
              protein,
              fats
            },
            $push: { meals: savedMeal[0]._id }
          },
          { 
            upsert: true,
            new: true,
            session 
          }
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
    res.status(500).json({ message: 'Error saving meal', error: error.message });
  }
});

module.exports = router;

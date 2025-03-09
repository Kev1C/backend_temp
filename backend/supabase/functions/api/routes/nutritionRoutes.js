// backend/routes/nutritionRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDailyNutrition,
  updateDailyNutrition,
  getNutritionCalculations,
  updateMacros,
  resetMacros,
  calculateNutritionalNeeds,
  getNutritionHeatmapData,
  getMonthlyNutrition
} = require('../../supabase/functions/api/controllers/nutritionController');
const auth = require('../../supabase/functions/api/middleware/auth');

// Apply auth middleware to all nutrition routes
router.use(auth);

// GET /api/nutrition/daily/:date - Get daily nutrition data
router.get('/daily/:date', getDailyNutrition);

// POST /api/nutrition/daily/:date - Update daily nutrition data
router.post('/daily/:date', updateDailyNutrition);

// GET /api/nutrition/calculations - Get nutrition calculations
router.get('/calculations', getNutritionCalculations);

// POST /api/nutrition/macros - Update daily macros
router.post('/macros', updateMacros);

// POST /api/nutrition/macros/reset - Reset daily macros
router.post('/macros/reset', resetMacros);

// POST /api/nutrition/calculate - Calculate user's daily nutritional needs
router.post('/calculate', calculateNutritionalNeeds);

// GET /api/nutrition/heatmap - Get nutrition completion data for heatmap
router.get('/heatmap', getNutritionHeatmapData);

// GET /api/nutrition/monthly/:year/:month - Get monthly nutrition data
router.get('/monthly/:year/:month', getMonthlyNutrition);

module.exports = router;

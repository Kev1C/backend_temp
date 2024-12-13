// backend/routes/nutritionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getDailyNutrition, 
  getNutritionCalculations,
  updateMacros,
  resetMacros
} = require('../controllers/nutritionController');

router.get('/daily/:date', auth, getDailyNutrition);
router.get('/calculations', auth, getNutritionCalculations);
router.post('/macros', auth, updateMacros);
router.post('/macros/reset', auth, resetMacros);

module.exports = router;

//backend/routes/meals.js
const express = require('express');
const router = express.Router();
const { getRecentMeals, addMeal } = require('../controllers/mealController');
const auth = require('../middleware/auth');

// Get recent meals
router.get('/recent', auth, getRecentMeals);

// Add a new meal
router.post('/', auth, addMeal);

module.exports = router;

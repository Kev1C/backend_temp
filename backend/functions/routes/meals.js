// backend/routes/meals.js
const express = require('express');
const router = express.Router();
const { getRecentMeals, addMeal } = require('../controllers/mealController');
const auth = require('../middleware/auth');

// Apply auth middleware to all meal routes
router.use(auth);

// GET /api/meals - Get recent meals
router.get('/', getRecentMeals);

// POST /api/meals - Add a new meal
router.post('/', addMeal);

module.exports = router;

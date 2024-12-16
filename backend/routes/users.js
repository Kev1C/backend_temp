const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUserData, updateUserData, updateNutritionalGoals } = require('../controllers/userController');
const { calculateNutritionalNeeds } = require('../controllers/nutritionController');

// Get user data
router.get('/me', auth, getUserData);

// Update user data
router.put('/me', auth, updateUserData);

// Calculate nutritional needs
router.post('/nutrition/calculate', auth, calculateNutritionalNeeds);

// Update nutritional goals
router.put('/nutrition-goals', auth, updateNutritionalGoals);

module.exports = router;

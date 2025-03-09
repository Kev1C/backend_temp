const express = require('express');
const router = express.Router();
const {
  getUserData,
  updateUserData,
  updateNutritionalGoals
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// Apply auth middleware to all user routes
router.use(auth);

// GET /api/users/me - Get current user data
router.get('/me', getUserData);

// PUT /api/users/me - Update user data
router.put('/me', updateUserData);

// POST /api/users/goals - Update nutritional goals
router.post('/goals', updateNutritionalGoals);

module.exports = router;

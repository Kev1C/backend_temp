// backend/routes/nutritionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDailyNutrition } = require('../controllers/nutritionController');

router.get('/daily/:date', auth, getDailyNutrition);

module.exports = router;

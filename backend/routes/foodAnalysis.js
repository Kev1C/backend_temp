// backend/routes/foodAnalysis.js
const express = require('express');
const router = express.Router();
const { analyzeFood } = require('../controllers/foodAnalysisController');

// POST /api/analyze-food
router.post('/analyze-food', analyzeFood);

module.exports = router;
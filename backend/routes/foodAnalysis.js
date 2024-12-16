// backend/routes/foodAnalysis.js
const express = require('express');
const router = express.Router();
const { analyzeFood } = require('../controllers/foodAnalysisController');
const auth = require('../middleware/auth');

// POST /api/food-analysis/analyze
router.post('/analyze', auth, analyzeFood);

module.exports = router;
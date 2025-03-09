// backend/routes/foodAnalysis.js
const express = require('express');
const router = express.Router();
const { analyzeFood } = require('../controllers/foodAnalysisController');
const auth = require('../middleware/auth');

// All food analysis routes require authentication
router.use(auth);

// Food analysis routes
router.post('/analyze', analyzeFood);

module.exports = router;

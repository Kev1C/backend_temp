// backend/routes/coins.js
const express = require('express');
const router = express.Router();
const { getCoinBalance, addCoins, deductCoins, purchaseCoins } = require('../controllers/coinController');
const auth = require('../middleware/auth'); // Protect routes

router.get('/balance', auth, getCoinBalance);
router.post('/add', auth, addCoins);
router.post('/deduct', auth, deductCoins);
router.post('/purchase', auth, purchaseCoins); // Will add RevenueCat later

module.exports = router;
// backend/routes/diamonds.js
const express = require('express');
const router = express.Router();
const { getDiamondBalance, addDiamonds, deductDiamonds, purchaseDiamonds } = require('../controllers/diamondController');
const auth = require('../middleware/auth'); // Protect routes

router.get('/balance', auth, getDiamondBalance);
router.post('/add', auth, addDiamonds);
router.post('/deduct', auth, deductDiamonds);
router.post('/purchase', auth, purchaseDiamonds); // Will add RevenueCat later

module.exports = router;
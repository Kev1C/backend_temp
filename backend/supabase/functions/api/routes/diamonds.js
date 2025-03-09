// backend/routes/diamonds.js
const express = require('express');
const router = express.Router();
const {
  getDiamondBalance,
  addDiamonds,
  deductDiamonds,
  purchaseDiamonds
} = require('../controllers/diamondController');
const auth = require('../middleware/auth');

// All diamond routes require authentication
router.use(auth);

// Diamond routes
router.get('/balance', getDiamondBalance);
router.post('/add', addDiamonds);
router.post('/deduct', deductDiamonds);
router.post('/purchase', purchaseDiamonds);

module.exports = router;

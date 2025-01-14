// backend/controllers/coinController.js
const Coin = require('../models/Coin');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get user's coin balance
// @route   GET /api/coins/balance
// @access  Private
const getCoinBalance = asyncHandler(async (req, res) => {
  const userId = req.user.userId; 

  const coin = await Coin.findOne({ user: userId });

  if (!coin) {
    res.status(404);
    throw new Error('Coin balance not found for user');
  }

  res.status(200).json({ balance: coin.balance });
});

// @desc    Add coins to user's balance (e.g., after watching an ad)
// @route   POST /api/coins/add
// @access  Private
const addCoins = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid amount');
  }

  const coin = await Coin.findOne({ user: userId });
    if (!coin) {
        res.status(404).json({ message: 'User not found' });
    }

  coin.balance += amount;
  await coin.save();

  res.status(200).json({ message: `${amount} coins added`, newBalance: coin.balance });
});

// @desc    Deduct coins from user's balance (e.g., after using a premium feature)
// @route   POST /api/coins/deduct
// @access  Private
const deductCoins = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid amount');
  }

  const coin = await Coin.findOne({ user: userId });
  if (!coin) {
    res.status(404).json({ message: 'User not found' });
  }

  if (coin.balance < amount) {
    res.status(400);
    throw new Error('Insufficient coins');
  }

  coin.balance -= amount;
  await coin.save();

  res.status(200).json({ message: `${amount} coins deducted`, newBalance: coin.balance });
});

// @desc    Handle coin purchase (integrate with RevenueCat webhooks later)
// @route   POST /api/coins/purchase
// @access  Private
const purchaseCoins = asyncHandler(async (req, res) => {
  // ... (Implementation to be added later with RevenueCat) ...
  res.status(200).json({ message: "Purchase endpoint - coming soon" });
});

module.exports = {
  getCoinBalance,
  addCoins,
  deductCoins,
  purchaseCoins
};
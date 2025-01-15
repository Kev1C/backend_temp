// backend/controllers/diamondController.js
const Diamond = require('../models/Diamond');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const asyncHandler = require('express-async-handler');

// @desc    Get user's diamond balance
// @route   GET /api/diamonds/balance
// @access  Private
const getDiamondBalance = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const diamond = await Diamond.findOne({ user: userId });

    if (!diamond) {
        res.status(404);
        throw new Error('Diamond balance not found for user');
    }

    res.status(200).json({ balance: diamond.balance });
});

// @desc    Add diamonds to user's balance
// @route   POST /api/diamonds/add
// @access  Private
const addDiamonds = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Invalid amount');
    }

    const diamond = await Diamond.findOne({ user: userId });
    if (!diamond) {
        res.status(404).json({ message: 'User not found' });
    }

    diamond.balance += amount;
    await diamond.save();

    // Create a transaction record
    await Transaction.create({
        user: userId,
        type: 'EARN',
        amount: amount,
        description: 'Earned diamonds from ad',
        balanceAfter: diamond.balance,
    });

    res.status(200).json({ message: `${amount} diamonds added`, newBalance: diamond.balance });
});

// @desc    Deduct diamonds from user's balance
// @route   POST /api/diamonds/deduct
// @access  Private
const deductDiamonds = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Invalid amount');
    }

    const diamond = await Diamond.findOne({ user: userId });
    if (!diamond) {
        res.status(404).json({ message: 'User not found' });
    }

    if (diamond.balance < amount) {
        res.status(400);
        throw new Error('Insufficient diamonds');
    }

    diamond.balance -= amount;
    await diamond.save();

    // Create a transaction record
    await Transaction.create({
        user: userId,
        type: 'SPEND',
        amount: amount,
        description: 'Deducted diamonds for premium feature',
        balanceAfter: diamond.balance,
    });

    res.status(200).json({ message: `${amount} diamonds deducted`, newBalance: diamond.balance });
});

// @desc    Handle diamond purchase (integrate with RevenueCat webhooks later)
// @route   POST /api/diamonds/purchase
// @access  Private
const purchaseDiamonds = asyncHandler(async (req, res) => {
    // ... (Implementation to be added later with RevenueCat) ...
    res.status(200).json({ message: "Purchase endpoint - coming soon" });
});

module.exports = {
    getDiamondBalance,
    addDiamonds,
    deductDiamonds,
    purchaseDiamonds
};
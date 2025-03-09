// backend/controllers/diamondController.js
const Diamond = require("../models/Diamond");
const Transaction = require("../models/Transactions");
const asyncHandler = require("express-async-handler");

// @desc    Get user's diamond balance
// @route   GET /api/diamonds/balance
// @access  Private
const getDiamondBalance = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  let diamond = await Diamond.findByUser(userId);

  if (!diamond) {
    // Create a new diamond record if it doesn't exist
    diamond = await Diamond.create({
      user: userId,
    });
    console.log("Created new diamond record for user:", userId);
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
    throw new Error("Invalid amount");
  }

  let diamond = await Diamond.findByUser(userId);
  let newBalance;
  
  if (!diamond) {
    // Create new diamond record if it doesn't exist
    diamond = await Diamond.create({
      user: userId,
    });
    newBalance = diamond.balance + amount;
    await Diamond.updateBalance(userId, newBalance);
  } else {
    // Update existing balance
    newBalance = diamond.balance + amount;
    await Diamond.updateBalance(userId, newBalance);
  }

  // Create a transaction record
  await Transaction.create({
    user: userId,
    type: "EARN",
    amount: amount,
    description: "Earned diamonds from ad",
    balanceAfter: newBalance,
  });

  // Send both the new balance and the amount added
  res.status(200).json({
    newBalance,
    added: amount,
    message: "Diamonds added successfully",
  });
});

// @desc    Deduct diamonds from user's balance
// @route   POST /api/diamonds/deduct
// @access  Private
const deductDiamonds = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("Invalid amount");
  }

  const diamond = await Diamond.findByUser(userId);
  if (!diamond) {
    res.status(404).json({ message: "User not found" });
  }

  if (diamond.balance < amount) {
    res.status(400);
    throw new Error("Insufficient diamonds");
  }

  const newBalance = diamond.balance - amount;
  await Diamond.updateBalance(userId, newBalance);

  // Create a transaction record
  await Transaction.create({
    user: userId,
    type: "SPEND",
    amount: amount,
    description: "Deducted diamonds for premium feature",
    balanceAfter: newBalance,
  });

  res.status(200).json({ message: `${amount} diamonds deducted`, newBalance });
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
  purchaseDiamonds,
};

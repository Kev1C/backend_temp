// backend/models/Diamond.js
const mongoose = require("mongoose");

const startingBalance = parseInt(process.env.STARTING_BALANCE, 10);

const diamondSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Ensure one diamond balance per user
  },
  balance: {
    type: Number,
    default: startingBalance, // Start with environment variable defined diamonds
    min: 0, // Prevent negative balances
  },
}, {timestamps: true});

module.exports = mongoose.model("Diamond", diamondSchema);

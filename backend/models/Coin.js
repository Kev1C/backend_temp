// backend/models/Coin.js
const mongoose = require('mongoose');

const coinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensure one coin balance per user
  },
  balance: {
    type: Number,
    default: 0, // Start with 0 coins
    min: 0     // Prevent negative balances
  }
}, { timestamps: true });

module.exports = mongoose.model('Coin', coinSchema);
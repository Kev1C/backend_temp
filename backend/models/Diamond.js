// backend/models/Diamond.js
const mongoose = require('mongoose');

const diamondSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensure one diamond balance per user
  },
  balance: {
    type: Number,
    default: 0, // Start with 0 diamonds
    min: 0     // Prevent negative balances
  }
}, { timestamps: true });

module.exports = mongoose.model('Diamond', diamondSchema);
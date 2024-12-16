const mongoose = require('mongoose');

const dailyNutritionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  calories: {
    type: Number,
    default: 0
  },
  carbs: {
    type: Number,
    default: 0
  },
  protein: {
    type: Number,
    default: 0
  },
  fats: {
    type: Number,
    default: 0
  },
  meals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal'
  }]
}, {
  timestamps: true
});

// Create a compound index on userId and date for efficient queries
dailyNutritionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyNutrition', dailyNutritionSchema);

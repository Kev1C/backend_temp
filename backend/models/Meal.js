const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  calories: {
    type: Number,
    required: true
  },
  carbs: {
    type: Number,
    required: true
  },
  protein: {
    type: Number,
    required: true
  },
  fats: {
    type: Number,
    required: true
  },
  time: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for userId and date
mealSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Meal', mealSchema);

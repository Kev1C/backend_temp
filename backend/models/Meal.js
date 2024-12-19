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
    required: true,
    description: 'Local path to the image file on user device'
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
    required: true
  }
}, { timestamps: true });

// Add index for userId and date for better query performance
mealSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('Meal', mealSchema);

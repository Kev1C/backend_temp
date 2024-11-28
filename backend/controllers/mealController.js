const Meal = require('../models/Meal');

// Get recent meals for a user
const getRecentMeals = async (req, res) => {
  try {
    console.log('Getting meals for user:', req.user.id);
    const meals = await Meal.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(10);
    res.json(meals);
  } catch (error) {
    console.error('Error getting recent meals:', error);
    res.status(500).json({ message: 'Error getting recent meals' });
  }
};

// Add a new meal
const addMeal = async (req, res) => {
  try {
    const { name, image, calories, carbs, protein, fats, time } = req.body;
    console.log('Adding meal for user:', req.user.id);
    
    const meal = new Meal({
      userId: req.user.id,  // Use consistent id field from auth middleware
      name,
      image,
      calories: parseInt(calories),
      carbs: parseInt(carbs),
      protein: parseInt(protein),
      fats: parseInt(fats),
      time,
      date: new Date()
    });

    const savedMeal = await meal.save();
    console.log('Meal saved successfully:', savedMeal);
    res.status(201).json(savedMeal);
  } catch (error) {
    console.error('Error adding meal:', error);
    res.status(500).json({ message: 'Error adding meal' });
  }
};

module.exports = {
  getRecentMeals,
  addMeal
};

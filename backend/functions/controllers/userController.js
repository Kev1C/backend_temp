// controllers/userController.js
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const DailyNutrition = require("../models/DailyNutrition");

// Get user data
const getUserData = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        needsOnboarding: true,
      });
    }

    // Add a timestamp to help client determine data freshness
    const response = {
      ...user,
      lastFetch: Date.now(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).json({message: "Server error"});
  }
};

// Update user data with optimized writes and etag support
const updateUserData = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const updates = {};

    const {gender, age, height, weight, goal, isOnboardingComplete} = req.body;

    if (gender) updates.gender = gender;
    if (age) updates.age = age;
    if (height) updates.height = height;
    if (weight) updates.weight = weight;
    if (goal) updates.fitnessGoal = goal;
    if (typeof isOnboardingComplete !== "undefined") {
      updates.isOnboardingComplete = isOnboardingComplete;
    }

    const user = await User.update(userId, updates);

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    // Generate ETag for caching
    const etag = require("crypto")
        .createHash("md5")
        .update(JSON.stringify(user))
        .digest("hex");

    res.set("ETag", etag);
    res.json(user);
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).json({message: "Server error"});
  }
};

// Update nutritional goals with optimized query and etag support
const updateNutritionalGoals = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const {calories, protein, carbs, fat} = req.body;

  try {
    // Get the current date
    const today = new Date().toISOString().split('T')[0];
    
    // Find existing daily nutrition record for today
    let dailyNutrition = await DailyNutrition.findByUserAndDate(userId, today);
    
    if (dailyNutrition) {
      // Update existing daily nutrition record
      dailyNutrition = await DailyNutrition.update(dailyNutrition.id, {
        calories: calories || dailyNutrition.calories,
        protein: protein || dailyNutrition.protein,
        carbs: carbs || dailyNutrition.carbs,
        fats: fat || dailyNutrition.fats
      });
    } else {
      // Create a new daily nutrition record
      dailyNutrition = await DailyNutrition.create({
        userId,
        date: today,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fats: fat || 0
      });
    }

    // Generate ETag for caching
    const etag = require("crypto")
        .createHash("md5")
        .update(JSON.stringify(dailyNutrition))
        .digest("hex");

    res.set("ETag", etag);
    res.json({
      nutritionalGoals: {
        calories: dailyNutrition.calories,
        protein: dailyNutrition.protein,
        carbs: dailyNutrition.carbs,
        fat: dailyNutrition.fats,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error("Error updating nutritional goals:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = {
  getUserData,
  updateUserData,
  updateNutritionalGoals,
};

// backend/controllers/mealController.js
const Meal = require("../models/Meal");
const DailyNutrition = require("../models/DailyNutrition");

// Get recent meals for a user
const getRecentMeals = async (req, res) => {
  try {
    console.log("Getting meals for user:", req.user.userId);
    console.log("Date parameter:", req.query.date);

    let options = {};

    // If date is provided, filter meals for that specific date
    if (req.query.date) {
      const requestedDate = new Date(req.query.date);
      console.log("Requested date:", requestedDate);

      // Create start and end of day in local time
      const startOfDay = new Date(
        requestedDate.getFullYear(),
        requestedDate.getMonth(),
        requestedDate.getDate(),
        0, 0, 0
      );

      const endOfDay = new Date(
        requestedDate.getFullYear(),
        requestedDate.getMonth(),
        requestedDate.getDate(),
        23, 59, 59, 999
      );

      console.log("Local timezone - Start of day:", startOfDay);
      console.log("Local timezone - End of day:", endOfDay);

      options.startDate = startOfDay.toISOString();
      options.endDate = endOfDay.toISOString();
    }

    const meals = await Meal.findByUser(req.user.userId, options);
    console.log("Found meals:", meals.length);
    res.json(meals);
  } catch (error) {
    console.error("Error getting recent meals:", error);
    res.status(500).json({message: "Error getting recent meals"});
  }
};

// Add a new meal
const addMeal = async (req, res) => {
  try {
    const {name, image, calories, carbs, protein, fats, time} = req.body;
    console.log("Adding meal for user:", req.user.userId);

    // Create date in local timezone and convert to UTC for Supabase
    const localDate = new Date();
    const utcDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes(),
      localDate.getSeconds()
    ));

    console.log("Saving meal with dates:", {
      localDate: localDate.toLocaleString(),
      utcDate: utcDate.toISOString(),
      localDateString: localDate.toDateString(),
      utcDateString: utcDate.toUTCString(),
      dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][localDate.getDay()],
    });

    // Create meal using the updated Meal model
    const mealData = {
      userId: req.user.userId,
      name,
      image,
      calories: parseInt(calories),
      carbs: parseInt(carbs),
      protein: parseInt(protein),
      fats: parseInt(fats),
      time,
      date: utcDate.toISOString(),
    };

    const savedMeal = await Meal.create(mealData);
    
    // Update daily nutrition with new meal data
    const dateOnly = utcDate.toISOString().split('T')[0];
    let dailyNutrition = await DailyNutrition.findByUserAndDate(req.user.userId, dateOnly);
    
    if (!dailyNutrition) {
      // Create new daily nutrition entry if it doesn't exist
      dailyNutrition = await DailyNutrition.create({
        userId: req.user.userId,
        date: dateOnly,
        calories: parseInt(calories),
        carbs: parseInt(carbs),
        protein: parseInt(protein),
        fats: parseInt(fats)
      });
    } else {
      // Update existing daily nutrition
      await DailyNutrition.update(dailyNutrition.id, {
        calories: dailyNutrition.calories + parseInt(calories),
        carbs: dailyNutrition.carbs + parseInt(carbs),
        protein: dailyNutrition.protein + parseInt(protein),
        fats: dailyNutrition.fats + parseInt(fats)
      });
    }
    
    // Add meal reference to daily nutrition
    await DailyNutrition.addMeal(dailyNutrition.id, savedMeal.id);

    console.log("Meal saved successfully:", savedMeal);
    res.status(201).json(savedMeal);
  } catch (error) {
    console.error("Error adding meal:", error);
    res.status(500).json({message: "Error adding meal"});
  }
};

module.exports = {
  getRecentMeals,
  addMeal,
};

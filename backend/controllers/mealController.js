const Meal = require('../models/Meal');


// Get recent meals for a user

const getRecentMeals = async (req, res) => {

  try {

    console.log('Getting meals for user:', req.user.id);

    console.log('Date parameter:', req.query.date);

    

    let query = { userId: req.user.id };

    

    // If date is provided, filter meals for that specific date

    if (req.query.date) {

      const requestedDate = new Date(req.query.date);

      console.log('Requested date:', requestedDate);

      

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

      

      console.log('Local timezone - Start of day:', startOfDay);

      console.log('Local timezone - End of day:', endOfDay);

      

      // Convert to UTC for MongoDB query

      const startOfDayUTC = new Date(startOfDay.toISOString());

      const endOfDayUTC = new Date(endOfDay.toISOString());

      

      console.log('UTC - Querying meals between:', startOfDayUTC, 'and', endOfDayUTC);

      

      query.date = {

        $gte: startOfDayUTC,

        $lte: endOfDayUTC

      };

    }



    const meals = await Meal.find(query).sort({ date: -1 });

    console.log('Found meals:', meals.length);

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

    

    // Create date in local timezone and convert to UTC for MongoDB

    const localDate = new Date();

    const utcDate = new Date(Date.UTC(

      localDate.getFullYear(),

      localDate.getMonth(),

      localDate.getDate(),

      localDate.getHours(),

      localDate.getMinutes(),

      localDate.getSeconds()

    ));

    

    console.log('Saving meal with dates:', {

      localDate: localDate.toLocaleString(),

      utcDate: utcDate.toISOString(),

      localDateString: localDate.toDateString(),

      utcDateString: utcDate.toUTCString(),

      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][localDate.getDay()]

    });

    

    const meal = new Meal({

      userId: req.user.id,

      name,

      image,

      calories: parseInt(calories),

      carbs: parseInt(carbs),

      protein: parseInt(protein),

      fats: parseInt(fats),

      time,

      date: utcDate

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


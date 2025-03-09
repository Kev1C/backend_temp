// backend/models/Meal.js
const connectDB = require('../config/db');

class Meal {
  // Find meals by user ID
  static async findByUser(userId, options = {}) {
    const supabase = await connectDB();
    
    let query = supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId);
    
    // Add date filtering if provided
    if (options.startDate && options.endDate) {
      query = query
        .gte('date', options.startDate)
        .lte('date', options.endDate);
    }
    
    // Add sorting
    if (options.sort) {
      query = query.order(options.sort.field, { ascending: options.sort.ascending });
    } else {
      query = query.order('date', { ascending: false });
    }
    
    // Add limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error finding meals:", error);
      throw error;
    }

    return data;
  }

  // Create new meal
  static async create(mealData) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('meals')
      .insert([{
        user_id: mealData.userId,
        name: mealData.name,
        image: mealData.image,
        calories: mealData.calories,
        carbs: mealData.carbs,
        protein: mealData.protein,
        fats: mealData.fats,
        time: mealData.time,
        date: mealData.date || new Date()
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating meal:", error);
      throw error;
    }

    return data;
  }

  // Aggregate meals for nutrition calculation
  static async aggregate(userId, startDate, endDate) {
    const supabase = await connectDB();
    
    // Supabase doesn't support MongoDB-like aggregation, so we'll fetch and calculate
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) {
      console.error("Error aggregating meals:", error);
      throw error;
    }

    // Calculate totals
    const totals = data.reduce((acc, meal) => {
      acc.totalCalories += meal.calories;
      acc.totalProtein += meal.protein;
      acc.totalCarbs += meal.carbs;
      acc.totalFats += meal.fats;
      acc.meals.push(meal);
      return acc;
    }, { 
      totalCalories: 0, 
      totalProtein: 0, 
      totalCarbs: 0, 
      totalFats: 0,
      meals: []
    });

    return [totals]; // Return in similar format to MongoDB aggregation
  }
}

module.exports = Meal;

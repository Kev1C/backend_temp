// backend/models/DailyNutrition.js
const connectDB = require('../config/db');

class DailyNutrition {
  // Get daily nutrition by user ID and date
  static async findByUserAndDate(userId, date) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('daily_nutrition')
      .select(`
        id, 
        user_id, 
        date, 
        calories, 
        carbs, 
        protein, 
        fats,
        meals:daily_nutrition_meals(meal_id)
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    if (error) {
      console.error("Error finding daily nutrition:", error);
      return null;
    }

    return data;
  }

  // Create new daily nutrition entry
  static async create(nutritionData) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('daily_nutrition')
      .insert([{
        user_id: nutritionData.userId,
        date: nutritionData.date,
        calories: nutritionData.calories || 0,
        carbs: nutritionData.carbs || 0,
        protein: nutritionData.protein || 0,
        fats: nutritionData.fats || 0
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating daily nutrition:", error);
      throw error;
    }

    return data;
  }

  // Update existing daily nutrition
  static async update(id, updates) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('daily_nutrition')
      .update({
        calories: updates.calories,
        carbs: updates.carbs,
        protein: updates.protein,
        fats: updates.fats,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating daily nutrition:", error);
      throw error;
    }

    return data;
  }

  // Add meal to daily nutrition
  static async addMeal(dailyNutritionId, mealId) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('daily_nutrition_meals')
      .insert([{
        daily_nutrition_id: dailyNutritionId,
        meal_id: mealId
      }]);
    
    if (error) {
      console.error("Error adding meal to daily nutrition:", error);
      throw error;
    }

    return true;
  }
}

module.exports = DailyNutrition;

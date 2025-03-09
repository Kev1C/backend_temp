// backend/models/Progress.js
const connectDB = require('../config/db');

class Progress {
  /**
   * Find progress entries by user ID
   * @param {string} userId - The user's ID
   * @returns {Promise<Array>} Array of progress entries
   */
  static async findByUser(userId) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error("Error finding progress:", error);
      throw error;
    }

    return data;
  }

  /**
   * Create new progress entry
   * @param {Object} progressData - The progress data to save
   * @returns {Promise<Object>} Created progress entry
   */
  static async create(progressData) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('progress')
      .insert([{
        user_id: progressData.user,
        date: progressData.date || new Date(),
        weight: progressData.weight,
        muscle_mass: progressData.muscleMass,
        fat_percentage: progressData.fatPercentage,
        chest_measurement: progressData.measurements?.chest,
        waist_measurement: progressData.measurements?.waist,
        hips_measurement: progressData.measurements?.hips
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating progress:", error);
      throw error;
    }

    return data;
  }

  /**
   * Get latest progress entry
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} Latest progress entry or null
   */
  static async findLatest(userId) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error finding latest progress:", error);
      throw error;
    }

    return data;
  }
}

module.exports = Progress;

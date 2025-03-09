// backend/models/Diamond.js
const connectDB = require('../config/db');

class Diamond {
  // Find diamond balance by user ID
  static async findByUser(userId) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('diamonds')
      .select('id, user_id, balance')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error finding diamond balance:", error);
      throw error;
    }

    return data;
  }

  // Create new diamond balance
  static async create(userData) {
    const supabase = await connectDB();
    
    const startingBalance = parseInt(process.env.STARTING_BALANCE, 10) || 50;
    
    const { data, error } = await supabase
      .from('diamonds')
      .insert([{
        user_id: userData.user,
        balance: startingBalance
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating diamond balance:", error);
      throw error;
    }

    return data;
  }

  // Update diamond balance
  static async updateBalance(userId, newBalance) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('diamonds')
      .update({
        balance: newBalance,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating diamond balance:", error);
      throw error;
    }

    return data;
  }
}

module.exports = Diamond;

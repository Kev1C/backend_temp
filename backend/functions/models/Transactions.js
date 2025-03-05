// backend/models/Transactions.js
const connectDB = require('../config/db');

class Transaction {
  // Create new transaction
  static async create(transactionData) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: transactionData.user,
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        balance_after: transactionData.balanceAfter
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }

    return data;
  }

  // Get user's transaction history
  static async findByUser(userId, limit = 20) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error finding transactions:", error);
      throw error;
    }

    return data;
  }
}

module.exports = Transaction;

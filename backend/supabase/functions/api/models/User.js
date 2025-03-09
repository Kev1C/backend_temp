// backend/models/User.js
const connectDB = require('../config/db');

class User {
  // Find user by ID
  static async findById(id) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, 
        username, 
        email, 
        firebase_uid, 
        auth_provider, 
        user_type, 
        role,
        gender,
        age,
        height,
        weight,
        activity_level,
        fitness_goal,
        is_onboarding_complete,
        created_at,
        updated_at,
        diamonds(id, balance)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error finding user by ID:", error);
      return null;
    }

    return this.transformUserData(data);
  }

  // Find user by Firebase UID (for migration purposes only)
  static async findByFirebaseUid(firebaseUid) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, 
        username, 
        email, 
        firebase_uid, 
        auth_provider, 
        user_type, 
        role,
        gender,
        age,
        height,
        weight,
        activity_level,
        fitness_goal,
        is_onboarding_complete,
        created_at,
        updated_at,
        diamonds(id, balance)
      `)
      .eq('firebase_uid', firebaseUid)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error finding user by Firebase UID:", error);
    }

    return error ? null : this.transformUserData(data);
  }

  // Create new user
  static async create(userData) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userData.id, // This ensures the Supabase Auth ID matches our users table ID
        username: userData.username,
        email: userData.email,
        firebase_uid: userData.firebaseUid,
        auth_provider: userData.authProvider || 'supabase',
        user_type: userData.type || 'regular',
        role: userData.role || 'user',
        gender: userData.gender,
        age: userData.age,
        height: userData.height,
        weight: userData.weight,
        activity_level: userData.activityLevel,
        fitness_goal: userData.fitnessGoal,
        is_onboarding_complete: userData.isOnboardingComplete || false
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating user:", error);
      throw error;
    }

    return this.transformUserData(data);
  }

  // Update user
  static async update(id, updates) {
    const supabase = await connectDB();
    
    const { data, error } = await supabase
      .from('users')
      .update({
        username: updates.username,
        email: updates.email,
        gender: updates.gender,
        age: updates.age,
        height: updates.height,
        weight: updates.weight,
        activity_level: updates.activityLevel,
        fitness_goal: updates.fitnessGoal,
        is_onboarding_complete: updates.isOnboardingComplete,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    return this.transformUserData(data);
  }

  // Helper to transform data from Supabase format to application format
  static transformUserData(data) {
    if (!data) return null;
    
    return {
      _id: data.id, // Keep MongoDB-style _id for compatibility
      id: data.id,
      username: data.username,
      email: data.email,
      firebaseUid: data.firebase_uid,
      authProvider: data.auth_provider,
      type: data.user_type,
      role: data.role,
      gender: data.gender,
      age: data.age,
      height: data.height,
      weight: data.weight,
      activityLevel: data.activity_level,
      fitnessGoal: data.fitness_goal,
      isOnboardingComplete: data.is_onboarding_complete,
      diamonds: data.diamonds ? data.diamonds[0]?.balance : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

module.exports = User;

// controllers/authController.js
const User = require("../models/User");
const Diamond = require("../models/Diamond");
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Sign up with email/password
const signUp = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Create the auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      return res.status(400).json({ message: authError.message });
    }
    
    // Create the user record in our database
    const user = await User.create({
      id: authData.user.id,
      username: username || email.split('@')[0],
      email,
      authProvider: 'supabase',
      type: "regular",
      isOnboardingComplete: false
    });
    
    // Create initial diamond balance
    const diamond = await Diamond.create({ user: user.id });
    user.diamonds = diamond.balance;
    
    // Return user data
    res.status(201).json({
      token: authData.session?.access_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        type: user.type,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
        fitnessGoal: user.fitnessGoal,
        isOnboardingComplete: user.isOnboardingComplete,
        diamonds: user.diamonds
      },
      onboardingNeedsSync: !user.isOnboardingComplete
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error creating account" });
  }
};

// Sign in with email/password
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(401).json({ message: error.message });
    }
    
    // Get user details from our users table
    const user = await User.findById(data.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      token: data.session.access_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        type: user.type,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
        fitnessGoal: user.fitnessGoal,
        isOnboardingComplete: user.isOnboardingComplete,
        diamonds: user.diamonds
      },
      onboardingNeedsSync: !user.isOnboardingComplete,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Error signing in" });
  }
};

// Sign in with OAuth providers (Google, Facebook, etc.)
const signInWithOAuth = async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({ message: "Provider is required" });
    }
    
    // Get the OAuth URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: process.env.OAUTH_REDIRECT_URL
      }
    });
    
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    
    res.json({ url: data.url });
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({ message: "Error initializing OAuth flow" });
  }
};

// Handle OAuth callback and user creation/retrieval
const handleOAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: "Auth code is required" });
    }
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    
    // Check if user exists in our database
    let user = await User.findById(data.user.id);
    
    if (!user) {
      // Create user record if not exists
      user = await User.create({
        id: data.user.id,
        username: data.user.email ? data.user.email.split('@')[0] : `user_${data.user.id}`,
        email: data.user.email,
        authProvider: data.user.app_metadata.provider || 'supabase',
        type: "regular",
        isOnboardingComplete: false
      });
      
      // Create initial diamond balance
      const diamond = await Diamond.create({ user: user.id });
      user.diamonds = diamond.balance;
    }
    
    // Return user data
    res.json({
      token: data.session.access_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        type: user.type,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
        fitnessGoal: user.fitnessGoal,
        isOnboardingComplete: user.isOnboardingComplete,
        diamonds: user.diamonds
      },
      onboardingNeedsSync: !user.isOnboardingComplete
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({ message: "Error processing OAuth callback" });
  }
};

// Sign out
const signOut = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    
    res.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("Signout error:", error);
    res.status(500).json({ message: "Error signing out" });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return res.status(400).json({ message: sessionError.message });
    }
    
    if (!sessionData.session) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return res.status(400).json({ message: userError.message });
    }
    
    // Get user details from our database
    const user = await User.findById(userData.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        type: user.type,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
        fitnessGoal: user.fitnessGoal,
        isOnboardingComplete: user.isOnboardingComplete,
        diamonds: user.diamonds
      }
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Error getting current user" });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL,
    });
    
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error sending password reset email" });
  }
};

// Update user password
const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }
    
    const { error } = await supabase.auth.updateUser({
      password
    });
    
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Error updating password" });
  }
};

module.exports = {
  signUp,
  signIn,
  signInWithOAuth,
  handleOAuthCallback,
  signOut,
  getCurrentUser,
  resetPassword,
  updatePassword
};

// backend/middleware/firebaseAuth.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// This middleware is for backward compatibility during migration
// It verifies Firebase tokens and creates users in Supabase if needed

const User = require('../models/User');
const admin = require('firebase-admin');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const firebaseAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Try to verify as Firebase token first
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Check if user exists in Supabase
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('id, email, firebase_uid')
        .eq('firebase_uid', decodedToken.uid)
        .single();
      
      if (!existingUser) {
        // User doesn't exist in Supabase yet, create them
        // First, create Supabase auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: decodedToken.email,
          email_confirm: true,
          user_metadata: {
            firebase_uid: decodedToken.uid
          }
        });
        
        if (authError) throw new Error(`Error creating Supabase auth user: ${authError.message}`);
        
        // Then create record in users table
        const userData = {
          id: authUser.user.id,
          username: decodedToken.email ? decodedToken.email.split('@')[0] : `user_${decodedToken.uid}`,
          email: decodedToken.email || `temp-${decodedToken.uid}@temp.com`,
          firebase_uid: decodedToken.uid,
          auth_provider: (decodedToken.firebase && decodedToken.firebase.sign_in_provider) || 'firebase',
          user_type: 'regular'
        };
        
        await supabase.from('users').insert([userData]);
        
        req.user = {
          userId: authUser.user.id,
          email: userData.email,
          username: userData.username,
          isFirebaseUser: true
        };
      } else {
        req.user = {
          userId: existingUser.id,
          email: existingUser.email,
          isFirebaseUser: true
        };
      }
      
      return next();
    } catch (firebaseError) {
      // Not a valid Firebase token, try Supabase next
      console.log('Not a valid Firebase token, trying Supabase...');
    }

    // Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Token verification failed, access denied' });
    }

    // Add user info to request
    req.user = {
      userId: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

module.exports = firebaseAuth;

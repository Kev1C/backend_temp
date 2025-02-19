// controllers/authController.js
const User = require('../models/User');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

const verifyFirebaseToken = async (req, res) => {
  try {
    const { firebaseToken, includeOnboardingStatus, syncOnboarding, onboardingData } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ message: 'Firebase token is required' });
    }

    // Verify the Firebase token with the Admin SDK.
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    if (!decodedToken) {
      return res.status(401).json({ message: 'Invalid Firebase token' });
    }

    // Attempt to find the user in MongoDB by Firebase UID.
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    let onboardingNeedsSync = false;

    if (!user) {
      // Create a new MongoDB user document.
      user = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || `temp-${decodedToken.uid}@temp.com`,
        username: decodedToken.email 
          ? decodedToken.email.split('@')[0] 
          : `user_${decodedToken.uid}`,
        authProvider:
          (decodedToken.firebase && decodedToken.firebase.sign_in_provider) ||
          'firebase',
        type: 'guest',
        isOnboardingComplete: false
      });
      await user.save();
      onboardingNeedsSync = true;
    } else if (includeOnboardingStatus) {
      // If requested, check if onboarding data still needs to be synchronized.
      onboardingNeedsSync = !user.isOnboardingComplete;
    }

    // If the client is sending onboarding data to sync, update the user.
    if (syncOnboarding && onboardingData) {
      const { gender, age, height, weight, goal } = onboardingData;
      user.gender = gender || user.gender;
      user.age = age || user.age;
      user.height = height || user.height;
      user.weight = weight || user.weight;
      user.fitnessGoal = goal || user.fitnessGoal;
      user.isOnboardingComplete = true;
      await user.save();
      onboardingNeedsSync = false;
    }

    // Extend the JWT payload with additional user data.
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      type: user.type,
      onboardingComplete: user.isOnboardingComplete
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return the token, user data, and onboarding status flag.
    res.json({
      token,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        type: user.type,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
        fitnessGoal: user.fitnessGoal,
        isOnboardingComplete: user.isOnboardingComplete
      },
      onboardingNeedsSync
    });
  } catch (error) {
    console.error('Firebase token verification error:', error);
    res.status(500).json({ message: 'Error verifying Firebase token' });
  }
};

module.exports = { verifyFirebaseToken };

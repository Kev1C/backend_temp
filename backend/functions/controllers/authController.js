// controllers/authController.js
const User = require("../models/User");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

const verifyFirebaseToken = async (req, res) => {
  try {
    const {firebaseToken, includeOnboardingStatus} = req.body;

    if (!firebaseToken) {
      return res.status(400).json({message: "Firebase token is required"});
    }

    // Verify the Firebase token with the Admin SDK.
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    if (!decodedToken) {
      return res.status(401).json({message: "Invalid Firebase token"});
    }

    // Find or create user in a single operation
    const user = await User.findOneAndUpdate(
        {firebaseUid: decodedToken.uid},
        {
          $setOnInsert: {
            email: decodedToken.email || `temp-${decodedToken.uid}@temp.com`,
            username: decodedToken.email ? decodedToken.email.split("@")[0] : `user_${decodedToken.uid}`,
            authProvider: (decodedToken.firebase && decodedToken.firebase.sign_in_provider) || "firebase",
            type: "guest",
            isOnboardingComplete: false,
          },
        },
        {new: true, upsert: true},
    );

    // Generate JWT token
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      type: user.type,
      onboardingComplete: user.isOnboardingComplete,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {expiresIn: "1h"});

    // Return the token and user data
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
        isOnboardingComplete: user.isOnboardingComplete,
      },
      onboardingNeedsSync: !user.isOnboardingComplete,
    });
  } catch (error) {
    console.error("Firebase token verification error:", error);
    res.status(500).json({message: "Error verifying Firebase token"});
  }
};

module.exports = {verifyFirebaseToken};

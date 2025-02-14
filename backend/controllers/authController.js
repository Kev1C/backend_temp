// controllers/authController.js

const User = require('../models/User'); // Adjust the path as necessary
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Verify Firebase token and create/update user
const verifyFirebaseToken = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ message: 'Firebase token is required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    if (!decodedToken) {
      return res.status(401).json({ message: 'Invalid Firebase token' });
    }

    // Find or create user based on Firebase UID
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // Create new user, using email if available, otherwise a placeholder
      user = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || `temp-${decodedToken.uid}@temp.com`,
        username: decodedToken.email ? decodedToken.email.split('@')[0] : `user_${decodedToken.uid}`,
        authProvider: decodedToken.firebase?.sign_in_provider || 'firebase',
        type: 'guest', // Assuming new users from Firebase are initially guests
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Return relevant user data and token
    res.json({
      token,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid, // Include Firebase UID
        email: user.email,
        username: user.username,
        authProvider: user.authProvider,
        type: user.type,
      },
    });
  } catch (error) {
    console.error('Firebase token verification error:', error);
    res.status(500).json({ message: 'Error verifying Firebase token' });
  }
};

module.exports = { verifyFirebaseToken };
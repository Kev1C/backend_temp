const express = require('express');
const router = express.Router();
const firebaseAuth = require('../middleware/firebaseAuth');
//const { register, login, getCurrentUser, updateProfile, refreshToken, verifyFirebaseToken } = require('../controllers/authController');
const { verifyFirebaseToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User'); // Add User model import

// Firebase auth routes
router.post('/verify-token', verifyFirebaseToken);
router.post('/authenticate', firebaseAuth, async (req, res) => {
    try {
        // Find or create user in your database
        let user = await User.findOne({ firebaseUid: req.user.firebaseUid });

        if (!user) {
            user = new User({
                firebaseUid: req.user.firebaseUid,
                email: req.user.email,
                isOnboardingComplete: false
            });
            await user.save();
        }

        res.json({
            token: req.backendToken,
            user: {
                id: user._id,
                email: user.email,
            }
        });
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ message: 'Server error during authentication' });
    }
});

// Regular auth routes
//router.post('/register', register);
//router.post('/login', login);
//router.get('/me', authMiddleware, getCurrentUser);
//router.put('/profile', authMiddleware, updateProfile);
//router.post('/refresh', refreshToken);

module.exports = router;
//backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const firebaseAuth = require('../middleware/firebaseAuth');
const User = require('../models/User');

// Initial authentication endpoint
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

        // Return the backend JWT
        res.json({
            token: req.backendToken,
            user: {
                id: user._id,
                email: user.email,
                // Add other user properties you want to return
            }
        });
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ message: 'Server error during authentication' });
    }
});

module.exports = router;
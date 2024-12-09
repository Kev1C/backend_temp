// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateProfile, refreshToken, verifyFirebaseToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-token', verifyFirebaseToken); // Add Firebase token verification endpoint
router.get('/me', authMiddleware, getCurrentUser); 
router.put('/profile', authMiddleware, updateProfile); // New route for updating profile during onboarding
router.post('/refresh', refreshToken); // Add refresh token endpoint

module.exports = router;
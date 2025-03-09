// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const { 
  signUpAnonymously,
  signInWithOAuth,
  handleOAuthCallback,
  signOut,
  getCurrentUser,
  deleteAccount
} = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/signup/anonymous', signUpAnonymously);
router.post('/signin/oauth', signInWithOAuth);
router.get('/callback', handleOAuthCallback);

// Protected routes (require authentication)
router.post('/signout', auth, signOut);
router.get('/me', auth, getCurrentUser);
router.delete('/account', auth, deleteAccount);

module.exports = router;

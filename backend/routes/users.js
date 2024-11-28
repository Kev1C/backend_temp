const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUserData, updateUserData } = require('../controllers/userController');

// Get user data
router.get('/me', auth, getUserData);

// Update user data
router.put('/me', auth, updateUserData);

module.exports = router;

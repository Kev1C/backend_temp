// controllers/authController.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path as necessary

// Function to generate JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET, // Ensure this matches the secret in auth.js
        { expiresIn: '1h' }      // Token validity duration
    );
};

// Login Function
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password); // Implement comparePassword in your User model
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        // Return token to client
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Register Function (Optional)
const register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { username },
                { email }
            ]
        });
        
        if (user) {
            return res.status(400).json({ 
                message: user.username === username ? 'Username already exists' : 'Email already exists'
            });
        }

        // Create new user with default desiredPhysique
        // This will be updated during the onboarding flow
        user = new User({ 
            username, 
            email, 
            password,
            desiredPhysique: 'athletic' // Default value, will be updated during onboarding
        });
        
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Return token to client
        res.status(201).json({ token });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error', details: err.message });
    }
};

// Get current user function
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Get current user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update profile function
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fields that can be updated from onboarding flow
        const allowedUpdates = [
            'gender',
            'height',
            'weight',
            'fitnessGoal',
            'desiredPhysique',
            'fitnessGoals',
            'dietaryPreferences',
            'dietaryRestrictions'
        ];

        // Only update fields that are provided in the request
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        await user.save();
        res.json({ message: 'Profile updated successfully', user: user.toObject({ hide: 'password' }) });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ 
            message: 'Server error', 
            details: err.message 
        });
    }
};

module.exports = { login, register, getCurrentUser, updateProfile };
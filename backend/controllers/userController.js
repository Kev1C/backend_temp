// controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Get user data
const getUserData = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        
        let user = await User.findById(userId)
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                needsOnboarding: true 
            });
        }

        // Add a timestamp to help client determine data freshness
        const response = {
            ...user,
            lastFetch: Date.now()
        };

        res.json(response);
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user data with optimized writes and etag support
const updateUserData = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const updates = {};
        
        const { gender, age, height, weight, goal, isOnboardingComplete } = req.body;
        
        if (gender) updates.gender = gender;
        if (age) updates.age = age;
        if (height) updates.height = height;
        if (weight) updates.weight = weight;
        if (goal) updates.fitnessGoal = goal;
        if (typeof isOnboardingComplete !== 'undefined') {
            updates.isOnboardingComplete = isOnboardingComplete;
        }

        // Add timestamp for updates
        updates.lastUpdated = Date.now();

        const user = await User.findOneAndUpdate(
            { _id: userId },
            { $set: updates },
            { 
                new: true,
                lean: true,
                select: '-password'
            }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate ETag for caching
        const etag = require('crypto')
            .createHash('md5')
            .update(JSON.stringify(user))
            .digest('hex');
            
        res.set('ETag', etag);
        res.json(user);
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update nutritional goals with optimized query and etag support
const updateNutritionalGoals = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { calories, protein, carbs, fat } = req.body;

    const updates = {};
    if (calories) updates['nutritionalGoals.calories'] = calories;
    if (protein) updates['nutritionalGoals.protein'] = protein;
    if (carbs) updates['nutritionalGoals.carbs'] = carbs;
    if (fat) updates['nutritionalGoals.fat'] = fat;
    updates['nutritionalGoals.lastUpdated'] = Date.now();

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { 
            new: true,
            lean: true,
            select: 'nutritionalGoals'
        }
    );

    if (!updatedUser) {
        res.status(404);
        throw new Error('User not found');
    }

    // Generate ETag for caching
    const etag = require('crypto')
        .createHash('md5')
        .update(JSON.stringify(updatedUser.nutritionalGoals))
        .digest('hex');
        
    res.set('ETag', etag);
    res.json({
        nutritionalGoals: updatedUser.nutritionalGoals
    });
});

module.exports = {
    getUserData,
    updateUserData,
    updateNutritionalGoals
};
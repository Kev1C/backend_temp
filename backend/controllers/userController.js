const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Get user data
const getUserData = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        console.log('Getting user data for ID:', userId);

        // Use lean() for better performance
        let user = await User.findById(userId)
            .select('-password')
            .lean();

        if (!user) {
            console.log('User not found for ID:', userId);
            // Instead of creating a default user immediately, return a 404
            return res.status(404).json({ 
                message: 'User not found',
                needsOnboarding: true 
            });
        }

        console.log('User data found:', user);
        res.json(user);
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user data with optimized writes
const updateUserData = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const updates = {};

        // Only include fields that are actually provided
        const { gender, age, height, weight, goal, isOnboardingComplete } = req.body;
        
        if (gender) updates.gender = gender;
        if (age) updates.age = age;
        if (height) updates.height = height;
        if (weight) updates.weight = weight;
        if (goal) updates.fitnessGoal = goal;
        if (typeof isOnboardingComplete !== 'undefined') {
            updates.isOnboardingComplete = isOnboardingComplete;
        }

        // Use findOneAndUpdate with lean() for better performance
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

        res.json(user);
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update nutritional goals with optimized query
const updateNutritionalGoals = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { calories, protein, carbs, fat } = req.body;

    const updates = {};
    if (calories) updates['nutritionalGoals.calories'] = calories;
    if (protein) updates['nutritionalGoals.protein'] = protein;
    if (carbs) updates['nutritionalGoals.carbs'] = carbs;
    if (fat) updates['nutritionalGoals.fat'] = fat;

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

    res.status(200).json({
        nutritionalGoals: updatedUser.nutritionalGoals
    });
});

module.exports = {
    getUserData,
    updateUserData,
    updateNutritionalGoals
};
const User = require('../models/User');
const { calculateNutritionRequirements } = require('./nutritionController');

// Update user data
const updateUserData = async (req, res) => {
    try {
        const { gender, height, weight, ageRange, activityLevel, goal } = req.body;
        const userId = req.user.userId || req.user.id;
        
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user data
        if (gender) user.gender = gender;
        if (height) user.height = height;
        if (weight) user.weight = weight;
        if (ageRange) user.ageRange = ageRange;
        if (activityLevel) user.activityLevel = activityLevel;
        if (goal) user.goal = goal;

        // Save updated user data
        await user.save();

        // Check if all required fields are present for nutrition calculations
        if (user.gender && user.height && user.weight && user.ageRange && 
            user.activityLevel && user.goal) {
            // Calculate nutrition requirements
            try {
                const nutritionReq = await calculateNutritionRequirements({
                    user: { userId }
                });
                user = await User.findById(userId); // Refresh user data
            } catch (error) {
                console.error('Error calculating nutrition requirements:', error);
                // Continue with response even if calculation fails
            }
        }

        res.json({
            message: 'User data updated successfully',
            user: {
                gender: user.gender,
                height: user.height,
                weight: user.weight,
                ageRange: user.ageRange,
                activityLevel: user.activityLevel,
                goal: user.goal,
                nutritionRequirements: user.nutritionRequirements
            }
        });
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user data
const getUserData = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUserData,
    updateUserData
};

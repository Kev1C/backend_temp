const User = require('../models/User');

// Get user data
const getUserData = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id; // Support both for backward compatibility
        console.log('Getting user data for ID:', userId);
        
        let user = await User.findById(userId).select('-password');
        
        if (!user) {
            console.log('User not found for ID:', userId);
            console.log('Creating default user data');
            
            // Create default user data
            user = new User({
                _id: userId,
                username: 'user_' + userId.substring(0, 6),
                email: 'user_' + userId.substring(0, 6) + '@example.com',
                password: 'defaultpassword',
                gender: 'other',
                height: 170,
                weight: 70,
                goal: 'get_fitter'
            });
            
            await user.save();
            console.log('Created default user:', user);
        }

        console.log('User data found:', user);
        res.json(user);
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user data
const updateUserData = async (req, res) => {
    try {
        const { gender, height, weight, goal } = req.body;
        const userId = req.user.userId || req.user.id; // Support both for backward compatibility
        
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user data
        if (gender) user.gender = gender;
        if (height) user.height = height;
        if (weight) user.weight = weight;
        if (goal) user.goal = goal;

        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUserData,
    updateUserData
};

// controllers/authController.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path as necessary
const admin = require('firebase-admin');

// Function to generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { expiresIn: '7d' }
    );
};

// Function to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user._id,
            id: user._id, // Include both userId and id for backward compatibility
            username: user.username,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

// Login Function
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user._id);

        // Return tokens to client
        res.json({ token, refreshToken });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Refresh token function
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
        
        // Check if user exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new tokens
        const token = generateToken(user);
        const newRefreshToken = generateRefreshToken(user._id);
        
        res.json({ token, refreshToken: newRefreshToken });
    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// Register Function
const register = async (req, res) => {
    try {
        const { type, userData } = req.body;
        console.log('Registration request:', { type, userData });

        if (type === 'guest') {
            // For guest users, create a temporary user without username/email/password
            const guestUser = new User({
                type: 'guest',
                ...userData,
                username: `guest_${Date.now()}`, // Temporary unique username
                email: `guest_${Date.now()}@temp.com`, // Temporary unique email
                password: 'guest' // This won't be hashed due to guest type check in pre-save
            });

            const savedUser = await guestUser.save();
            console.log('Guest user created:', savedUser);

            // Generate tokens
            const token = generateToken(savedUser);
            const refreshToken = generateRefreshToken(savedUser._id);

            res.status(201).json({
                success: true,
                token,
                refreshToken,
                user: {
                    id: savedUser._id,
                    type: savedUser.type,
                    gender: savedUser.gender,
                    height: savedUser.height,
                    weight: savedUser.weight,
                    fitnessGoal: savedUser.fitnessGoal,
                    isOnboardingComplete: savedUser.isOnboardingComplete
                }
            });
        } else {
            // Handle regular user registration
            const { email, password, username } = userData;
            
            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });

            if (existingUser) {
                return res.status(400).json({
                    message: 'User already exists with that email or username'
                });
            }

            // Create new user
            const user = new User({
                ...userData,
                type: 'regular'
            });

            const savedUser = await user.save();
            console.log('Regular user created:', savedUser);

            // Generate tokens
            const token = generateToken(savedUser);
            const refreshToken = generateRefreshToken(savedUser._id);

            res.status(201).json({
                success: true,
                token,
                refreshToken,
                user: {
                    id: savedUser._id,
                    email: savedUser.email,
                    username: savedUser.username,
                    type: savedUser.type,
                    gender: savedUser.gender,
                    height: savedUser.height,
                    weight: savedUser.weight,
                    fitnessGoal: savedUser.fitnessGoal,
                    isOnboardingComplete: savedUser.isOnboardingComplete
                }
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
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

// Verify Firebase token and create/update user
const verifyFirebaseToken = async (req, res) => {
    try {
        const { firebaseToken } = req.body;
        
        if (!firebaseToken) {
            return res.status(400).json({ message: 'Firebase token is required' });
        }

        // Verify the Firebase token using firebase-admin
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        
        if (!decodedToken) {
            return res.status(401).json({ message: 'Invalid Firebase token' });
        }

        // Find or create user based on Firebase UID
        let user = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (!user) {
            // Create new user with email if available, otherwise set a placeholder
            user = await User.create({
                firebaseUid: decodedToken.uid,
                email: decodedToken.email || `temp-${decodedToken.uid}@temp.com`, // Set placeholder email
                username: decodedToken.email ? decodedToken.email.split('@')[0] : `user_${decodedToken.uid}`,
                authProvider: decodedToken.firebase?.sign_in_provider || 'firebase'
            });
        }

        // Generate backend JWT
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            token,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                authProvider: user.authProvider
            }
        });
    } catch (error) {
        console.error('Firebase token verification error:', error);
        res.status(500).json({ message: 'Error verifying Firebase token' });
    }
};

module.exports = { login, register, getCurrentUser, updateProfile, refreshToken, verifyFirebaseToken };

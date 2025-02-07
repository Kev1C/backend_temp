//backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: function() { return this.type !== 'guest'; } },
    email: { 
        type: String, 
        required: function() { 
            return this.type !== 'guest' && this.authProvider === 'local'; 
        } 
    },
    password: { 
        type: String, 
        required: function() { 
            return this.type === 'regular' && !this.firebaseUid; 
        } 
    },
    firebaseUid: { type: String, sparse: true, unique: true },
    authProvider: { type: String, enum: ['local', 'google', 'anonymous', 'firebase'], default: 'local' },
    type: { type: String, enum: ['guest', 'regular'], default: 'regular' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Onboarding information
    gender: { type: String, enum: ['male', 'female', 'other'] },
    age: { type: Number }, // in years
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    fitnessGoal: { type: String, enum: ['lose_weight', 'get_fitter', 'gain_muscle'], default: 'get_fitter' },
    isOnboardingComplete: { type: Boolean, default: false },
    // Additional preferences
    desiredPhysique: { type: String, enum: ['lean', 'muscular', 'athletic'], default: 'athletic' },
    dietaryPreferences: [String],
    dietaryRestrictions: [String],
    // Reference to Diamond model
    diamonds: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Diamond'
    },
}, { timestamps: true });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.type === 'guest' || this.authProvider !== 'local') return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch(err) {
        next(err);
    }
});

// Password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    if (this.type === 'guest' || this.authProvider !== 'local') return true;
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch(err) {
        throw err;
    }
};

module.exports = mongoose.model('User', UserSchema);
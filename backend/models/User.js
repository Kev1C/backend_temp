const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: function() { return this.type !== 'guest'; }, unique: true },
    email: { type: String, required: function() { return this.type !== 'guest'; }, unique: true },
    password: { type: String, required: function() { return this.type !== 'guest'; } },
    type: { type: String, enum: ['guest', 'regular'], default: 'regular' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Onboarding information
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    fitnessGoal: { type: String, enum: ['lose_weight', 'get_fitter', 'gain_muscle'], default: 'get_fitter' },
    isOnboardingComplete: { type: Boolean, default: false },
    // Additional preferences
    desiredPhysique: { type: String, enum: ['lean', 'muscular', 'athletic'], default: 'athletic' },
    dietaryPreferences: [String],
    dietaryRestrictions: [String],
}, { timestamps: true });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.type === 'guest') return next();
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
    if (this.type === 'guest') return true;
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch(err) {
        throw err;
    }
};

module.exports = mongoose.model('User', UserSchema);
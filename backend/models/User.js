const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Added role field
    desiredPhysique: { type: String, enum: ['lean', 'muscular', 'athletic'], required: true },
    fitnessGoals: [String], // e.g., ['strength', 'endurance']
    dietaryPreferences: [String],
    dietaryRestrictions: [String],
}, { timestamps: true });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch(err) {
        next(err);
    }
});

// Password comparison method
UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
}

module.exports = mongoose.model('User', UserSchema);
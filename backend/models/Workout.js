// models/Workout.js
const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    exercises: [{
        exercise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise',
            required: true
        },
        sets: {
            type: Number,
            required: true,
            min: 1
        },
        reps: {
            type: Number,
            required: true,
            min: 1
        },
        weight: {
            type: Number,
            min: 0
        },
        duration: {
            type: Number,
            min: 0
        },
        notes: String
    }],
    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Workout', workoutSchema);

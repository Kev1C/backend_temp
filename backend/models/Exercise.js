// models/Exercise.js

const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
    },
    muscles: {
        type: [String],
        index: true,
    },
    equipment: {
        type: [String],
        index: true,
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
        index: true,
    },
    gender: {
        maleUrl: {
            type: String,
            default: '',
            validate: {
                validator: function(v) {
                    return !v || /^https?:\/\/.+\..+/.test(v);
                },
                message: props => `${props.value} is not a valid URL!`
            },
        },
        femaleUrl: {
            type: String,
            default: '',
            validate: {
                validator: function(v) {
                    return !v || /^https?:\/\/.+\..+/.test(v);
                },
                message: props => `${props.value} is not a valid URL!`
            },
        },
    },
    description: {
        type: String,
        default: '',
    },
    imageUrl: {
        type: String,
        default: '',
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+\..+/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        },
    },
    videoUrl: {
        type: String,
        default: '',
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+\..+/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        },
    },
}, { timestamps: true });

// Create a text index for fast searching on `name`, `muscles`, `equipment`, and `description`
ExerciseSchema.index({ name: 'text', muscles: 'text', equipment: 'text', description: 'text' });

module.exports = mongoose.model('Exercise', ExerciseSchema);
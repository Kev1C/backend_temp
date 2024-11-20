// backend/routes/progress.js
const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const User = require('../models/User'); // Add this if not already imported
const auth = require('../middleware/auth');

// Add Progress Entry
router.post('/', auth, async (req, res) => {
    try {
        console.log('=== DEBUG: Progress POST Request ===');
        console.log('Request body:', req.body);
        console.log('User ID:', req.user.id);

        const { weight, muscleMass, fatPercentage, measurements } = req.body;

        // Validate input
        if (!weight || !muscleMass || !fatPercentage || !measurements) {
            return res.status(400).json({ 
                error: 'All fields are required.',
                received: { weight, muscleMass, fatPercentage, measurements }
            });
        }

        const progress = new Progress({
            user: req.user.id,
            weight: Number(weight),
            muscleMass: Number(muscleMass),
            fatPercentage: Number(fatPercentage),
            measurements: {
                chest: Number(measurements.chest),
                waist: Number(measurements.waist),
                hips: Number(measurements.hips)
            }
        });

        console.log('Progress object before save:', progress);
        const savedProgress = await progress.save();
        console.log('Saved progress:', savedProgress);

        res.status(201).json(savedProgress);
    } catch (err) {
        console.error('Error saving progress:', err);
        res.status(500).json({ 
            error: 'Server error while saving progress.',
            details: err.message 
        });
    }
});

// Get Progress Entries
router.get('/', auth, async (req, res) => {
    try {
        console.log('=== DEBUG: Progress GET Request ===');
        console.log('User ID from request:', req.user.id);
        console.log('Auth header:', req.header('Authorization'));

        // Verify user exists
        const userExists = await User.findById(req.user.id);
        console.log('User exists:', !!userExists);

        // Get progress entries
        const progresses = await Progress.find({ user: req.user.id })
            .sort({ date: -1 })
            .lean();

        console.log('Retrieved progress entries:', progresses.length);
        console.log('First entry (if exists):', progresses[0] || 'No entries');

        res.json(progresses);
    } catch (err) {
        console.error('Error fetching progresses:', err);
        res.status(500).json({ 
            error: 'Server error while fetching progresses.',
            details: err.message
        });
    }
});

module.exports = router;
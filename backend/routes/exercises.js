// backend/routes/exercises.js
const express = require('express');
const router = express.Router();
const ExerciseService = require('../services/exerciseService');
const auth = require('../middleware/auth');

// GET /api/exercises
router.get('/', auth, async (req, res) => {
    console.log('GET /api/exercises called');
    const userId = req.user.userId;
    console.log('Authenticated User ID:', userId);
    const { search, muscle, equipment, difficulty, gender } = req.query;

    try {
        // Fetch user data if needed (currently unused in filtering)
        const User = require('../models/User');
        const user = await User.findById(userId);

        if (!user) {
            console.warn(`User with ID ${userId} not found.`);
            return res.status(404).json({ message: 'User not found.' });
        }

        // Define search filters
        const filters = {
            search: search || '',
            muscle: muscle || '',
            equipment: equipment || '',
            difficulty: difficulty || '',
        };

        console.log(`Filters applied: ${JSON.stringify(filters)}`);

        // Perform search
        const exercises = ExerciseService.searchExercises(filters);
        console.log(`Fetched ${exercises.length} exercises for user ${userId}`);
        res.json(exercises);
    } catch (err) {
        console.error('Error fetching exercises:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
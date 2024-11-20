// backend/routes/workouts.js

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const workoutsController = require('../controllers/workoutsController');
const auth = require('../middleware/auth');

// Apply the auth middleware to all routes in this router
router.use(auth);

// Validation middleware
const validateWorkout = [
    body('name').notEmpty().trim().withMessage('Workout name is required'),
    body('exercises').isArray().withMessage('Exercises must be an array'),
    body('exercises.*.exercise').notEmpty().withMessage('Exercise ID is required'),
    body('exercises.*.sets').isInt({ min: 1 }).withMessage('Sets must be at least 1'),
    body('exercises.*.reps').isInt({ min: 1 }).withMessage('Reps must be at least 1')
];

// Middleware to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/workouts
router.get('/', workoutsController.getUserWorkouts);

// POST /api/workouts
router.post('/', validateWorkout, validate, workoutsController.createWorkout);

// PUT /api/workouts/:id
router.put('/:id', validateWorkout, validate, workoutsController.updateWorkout);

// DELETE /api/workouts/:id
router.delete('/:id', workoutsController.deleteWorkout);

module.exports = router;
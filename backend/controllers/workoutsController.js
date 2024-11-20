// controllers/workoutsController.js
const Workout = require('../models/Workout');

// Get user's workouts
const getUserWorkouts = async (req, res) => {
    try {
        const workouts = await Workout.find({ userId: req.user.userId })
            .populate('exercises.exercise')
            .sort({ createdAt: -1 });
        res.json(workouts);
    } catch (err) {
        console.error('Error fetching workouts:', err);
        res.status(500).json({ message: 'Error fetching workouts' });
    }
};

// Create a new workout
const createWorkout = async (req, res) => {
    try {
        const { name, description, exercises } = req.body;
        const workout = new Workout({
            userId: req.user.userId,
            name,
            description,
            exercises
        });
        await workout.save();
        res.status(201).json(workout);
    } catch (err) {
        console.error('Error creating workout:', err);
        res.status(500).json({ message: 'Error creating workout' });
    }
};

// Update a workout
const updateWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            req.body,
            { new: true }
        );
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }
        res.json(workout);
    } catch (err) {
        console.error('Error updating workout:', err);
        res.status(500).json({ message: 'Error updating workout' });
    }
};

// Delete a workout
const deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }
        res.json({ message: 'Workout deleted successfully' });
    } catch (err) {
        console.error('Error deleting workout:', err);
        res.status(500).json({ message: 'Error deleting workout' });
    }
};

module.exports = {
    getUserWorkouts,
    createWorkout,
    updateWorkout,
    deleteWorkout
};

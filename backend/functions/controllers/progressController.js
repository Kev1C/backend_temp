//backend/functions/controllers/progressController.js
const Progress = require('../models/Progress');
const User = require('../models/User');

const progressController = {
  // Add a new progress entry
  createProgress: async (userId, progressData) => {
    try {
      // Create a formatted progress object
      const progressToCreate = {
        user: userId,
        weight: Number(progressData.weight),
        muscleMass: progressData.muscleMass ? Number(progressData.muscleMass) : null,
        fatPercentage: progressData.fatPercentage ? Number(progressData.fatPercentage) : null,
        measurements: progressData.measurements || {},
        date: progressData.date || new Date()
      };

      // Use the static create method on the Progress model
      const savedProgress = await Progress.create(progressToCreate);
      return savedProgress;
    } catch (error) {
      console.error("Error in createProgress controller:", error);
      throw error;
    }
  },

  // Get all progress entries for a user
  getUserProgress: async (userId) => {
    try {
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Use the static findByUser method on the Progress model
      const progressEntries = await Progress.findByUser(userId);
      return progressEntries;
    } catch (error) {
      console.error("Error in getUserProgress controller:", error);
      throw error;
    }
  },

  // Get latest progress entry for a user
  getLatestProgress: async (userId) => {
    try {
      const latestProgress = await Progress.findLatest(userId);
      return latestProgress;
    } catch (error) {
      console.error("Error in getLatestProgress controller:", error);
      throw error;
    }
  }
};

module.exports = progressController;

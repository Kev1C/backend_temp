// backend/routes/progress.js
const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progressController");
const auth = require("../middleware/auth");

// Add Progress Entry
router.post("/", auth, async (req, res) => {
  try {
    console.log("=== DEBUG: Progress POST Request ===");
    console.log("Request body:", req.body);
    console.log("User ID:", req.user.userId);

    const { weight } = req.body;

    // Validate input
    if (!weight) {
      return res.status(400).json({
        error: "Weight is required.",
        received: { weight },
      });
    }

    const savedProgress = await progressController.createProgress(
      req.user.userId, 
      req.body
    );
    
    console.log("Saved progress:", savedProgress);
    res.status(201).json(savedProgress);
  } catch (err) {
    console.error("Error saving progress:", err);
    res.status(500).json({
      error: "Server error while saving progress.",
      details: err.message,
    });
  }
});

// Get Progress Entries
router.get("/", auth, async (req, res) => {
  try {
    console.log("=== DEBUG: Progress GET Request ===");
    console.log("User ID from request:", req.user.userId);
    console.log("Auth header:", req.header("Authorization"));

    const progresses = await progressController.getUserProgress(req.user.userId);

    console.log("Retrieved progress entries:", progresses.length);
    console.log("First entry (if exists):", progresses[0] || "No entries");

    res.json(progresses);
  } catch (err) {
    console.error("Error fetching progresses:", err);
    res.status(500).json({
      error: "Server error while fetching progresses.",
      details: err.message,
    });
  }
});

// Get latest progress entry
router.get("/latest", auth, async (req, res) => {
  try {
    const latestProgress = await progressController.getLatestProgress(req.user.userId);
    
    if (!latestProgress) {
      return res.status(404).json({ message: "No progress entries found" });
    }
    
    res.json(latestProgress);
  } catch (err) {
    console.error("Error fetching latest progress:", err);
    res.status(500).json({
      error: "Server error while fetching latest progress.",
      details: err.message,
    });
  }
});

module.exports = router;

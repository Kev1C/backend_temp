// backend/routes/users.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {getUserData, updateUserData, updateNutritionalGoals} = require("../controllers/userController");

// Get user data
router.get("/me", auth, getUserData);

// Update user data
router.put("/me", auth, updateUserData);

// Update nutritional goals
router.put("/nutrition-goals", auth, updateNutritionalGoals);

module.exports = router;

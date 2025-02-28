// backend/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {type: String, required: function() {
    return this.type !== "guest";
  }},
  email: {type: String, required: function() {
    return this.type !== "guest";
  }},
  firebaseUid: {type: String, sparse: true, unique: true},
  authProvider: {type: String, enum: ["local", "google", "anonymous", "firebase"], default: "firebase"},
  type: {type: String, enum: ["guest", "regular"], default: "regular"},
  role: {type: String, enum: ["user", "admin"], default: "user"},
  // Onboarding information
  gender: {type: String, enum: ["male", "female", "other"]},
  age: {type: Number}, // in years
  height: {type: Number}, // in cm
  weight: {type: Number}, // in kg
  activityLevel: {type: String, enum: ["sedentary", "lightly_active", "moderately_active", "very_active"], default: "moderately_active"},
  fitnessGoal: {type: String, enum: ["lose_weight", "get_fitter", "gain_muscle"], default: "get_fitter"},
  isOnboardingComplete: {type: Boolean, default: false},
  // Additional preferences
  //desiredPhysique: {type: String, enum: ["lean", "muscular", "athletic"], default: "athletic"},
  //dietaryPreferences: [String],
  //dietaryRestrictions: [String],
  // Reference to Diamond model
  diamonds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Diamond",
  },
}, {timestamps: true});

module.exports = mongoose.model("User", UserSchema);

// models/Progress.js
const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  date: {type: Date, default: Date.now},
  weight: {type: Number}, // in kg or lbs
  muscleMass: {type: Number}, // in kg or appropriate unit
  fatPercentage: {type: Number},
  measurements: {
    chest: {type: Number},
    waist: {type: Number},
    hips: {type: Number},
    // Add more as needed
  },
}, {timestamps: true});

module.exports = mongoose.model("Progress", ProgressSchema);

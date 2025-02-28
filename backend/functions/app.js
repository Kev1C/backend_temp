// backend/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const admin = require("firebase-admin");
const path = require("path");

try {
  require("dotenv").config({path: path.join(__dirname, ".env")});
  console.log("Environment variables loaded:", {
    USE_FIREBASE_EMULATOR: process.env.USE_FIREBASE_EMULATOR,
    // FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  });
} catch (error) {
  console.error("Failed to load .env file:", error);
}

// Import custom middleware and database connection helper
const {errorHandler, notFound} = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");

// Remove Firebase Admin SDK initialization from here as it's already in index.js
// Firebase Admin will be available through the require('firebase-admin') above

// Import routes
const authRoutes = require("./routes/auth");
// const exerciseRoutes = require('./routes/exercises');
const progressRoutes = require("./routes/progress");
const foodAnalysisRoutes = require("./routes/foodAnalysis");
const mealRoutes = require("./routes/meals");
// const workoutsRoutes = require('./routes/workouts');
const userRoutes = require("./routes/users");
const nutritionRoutes = require("./routes/nutritionRoutes");
const diamondRoutes = require("./routes/diamonds");

// Connect to database
connectDB().catch(console.error);

const app = express();

// Request logging using morgan
app.use(morgan("dev"));

// Custom request logger (optional)
app.use((req, res, next) => {
  console.log("Incoming request:", {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers,
  });
  next();
});

// URL rewriting middleware for requests starting with "/api/api"
app.use((req, res, next) => {
  if (req.url.startsWith("/api/api")) {
    req.url = req.url.replace("/api/api", "/api");
  }
  next();
});

// CORS configuration
app.use(
    cors({
      origin: [
        "http://localhost:19000",
        "http://localhost:19006",
        "exp://localhost:19000",
        "http://10.0.2.2:19000",
        "http://10.0.2.2:19006",
        "exp://10.0.2.2:19000",
        "exp://10.0.2.2:19006",
        "http://10.0.2.2:5001",
        "http://localhost:5001",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept", "Firebase-Token"],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    }),
);
app.options("*", cors());

// Body parsing middleware
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: true, limit: "50mb"}));

// Health check endpoints
app.get("/", (req, res) => {
  res.json({message: "Fitness App API is running"});
});
app.get("/api/health", (req, res) => {
  res.json({status: "ok", timestamp: new Date()});
});

// Mount routes
app.use("/api/auth", authRoutes);
// app.use('/api/exercises', exerciseRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/food-analysis", foodAnalysisRoutes);
app.use("/api/meals", mealRoutes);
// app.use('/api/workouts', workoutsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/diamonds", diamondRoutes);

// Error handling middleware: 404 then global error handler
app.use(notFound);
app.use(errorHandler);

// NO SERVER START HERE - this section has been removed

// Export the Express app
module.exports = app;

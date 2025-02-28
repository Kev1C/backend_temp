// backend/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const admin = require("firebase-admin");
const path = require("path");

// Load environment variables
try {
  require("dotenv").config({path: path.join(__dirname, ".env")});
  console.log("Environment variables loaded successfully");
} catch (error) {
  console.error("Failed to load .env file:", error);
}

// Import custom middleware and database connection helper
const {errorHandler, notFound} = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");

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

// Create Express app first
const app = express();

// Connect to database but don't block startup if it fails
connectDB().catch((error) => {
  console.error("Database connection failed, but continuing function startup:", error.message);
});

// Request logging using morgan
app.use(morgan("dev"));

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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Export the Express app
module.exports = app;

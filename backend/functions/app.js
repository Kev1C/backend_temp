// backend/app.js
// require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const admin = require("firebase-admin");

try {
  const path = require("path");
  require("dotenv").config({path: path.join(__dirname, ".env")});
  console.log("Environment variables loaded:", {
    USE_FIREBASE_EMULATOR: process.env.USE_FIREBASE_EMULATOR,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  });
} catch (error) {
  console.error("Failed to load .env file:", error);
}

// Custom error handling middleware
const {errorHandler, notFound} = require("./middleware/errorMiddleware");
// Database connection helper
const connectDB = require("./config/db");

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    if (process.env.USE_FIREBASE_EMULATOR) {
      // When running with emulators, use a default config that matches the frontend project
      admin.initializeApp({
        projectId: "fitness-app-bf54e",
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // If you've stored your service account in an environment variable, parse it
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || "fitness-app-bf54e",
      });
    } else {
      // When deployed on Firebase, initializeApp() without parameters is enough
      admin.initializeApp();
    }
    console.log("Firebase Admin SDK initialized successfully.");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

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

// Remove the isDbConnected flag and connect before setting up routes
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
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "Firebase-Token",
      ],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    }),
);
// Enable pre-flight requests for all routes
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

// Only start the server automatically when this file is run directly.
// When deployed as a Firebase Cloud Function, Firebase will import the app without triggering app.listen().
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;

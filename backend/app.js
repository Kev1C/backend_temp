// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const admin = require('firebase-admin');

// Load environment variables from .env file

// Initialize Firebase Admin SDK
try {
    console.log("Raw FIREBASE_SERVICE_ACCOUNT:", process.env.FIREBASE_SERVICE_ACCOUNT);
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("Parsed service account:", serviceAccount);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
}

// Import routes
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const progressRoutes = require('./routes/progress');
const foodAnalysisRoutes = require('./routes/foodAnalysis');
const mealRoutes = require('./routes/meals');
const workoutsRoutes = require('./routes/workouts');
const userRoutes = require('./routes/users');
const nutritionRoutes = require('./routes/nutritionRoutes');
const diamondRoutes = require('./routes/diamonds');

// Connect to database
connectDB();

const app = express();

// Request logging
app.use(morgan('dev'));

// Custom request logger
app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        url: req.url,
        body: req.body,
        headers: req.headers
    });
    next();
});

// CORS configuration
app.use(cors({
    origin: ['http://localhost:19000', 'http://localhost:19006', 'exp://localhost:19000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Firebase-Token'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Enable pre-flight requests for all routes
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check route (place before other routes)
app.get('/', (req, res) => {
    res.json({ message: 'Fitness App API is running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/food-analysis', foodAnalysisRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/diamonds', diamondRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

module.exports = app;

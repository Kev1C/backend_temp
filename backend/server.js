// backend/server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan'); // For logging HTTP requests
const helmet = require('helmet'); // For securing HTTP headers
const rateLimit = require('express-rate-limit'); // For rate limiting
const compression = require('compression');
const mcache = require('memory-cache');

const app = express();

// Cache middleware with size limit and expiration
const cache = (duration) => {
    return (req, res, next) => {
        const key = '__express__' + req.originalUrl || req.url;
        const cachedBody = mcache.get(key);
        if (cachedBody) {
            res.send(JSON.parse(cachedBody));
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                // Only cache if body size is less than 1MB
                if (JSON.stringify(body).length < 1000000) {
                    mcache.put(key, JSON.stringify(body), duration * 1000);
                }
                res.sendResponse(body);
            }
            next();
        }
    }
};

// Middleware
app.use(compression({ level: 6 })); // Optimize compression
app.use(express.json({ limit: '50mb' })); // Reduce payload size limit
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());

// Only use Morgan in development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Use 'combined' for production
}

// CORS Configuration
const allowedOrigins = ['http://localhost:19006', 'http://10.0.0.203:5000']; // Update with your frontend's origin(s)

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// Apply rate limiting to auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authLimiter, authRoutes);

// Mount Other Routes
const exerciseRoutes = require('./routes/exercises');
const progressRoutes = require('./routes/progress');
const foodAnalysisRoutes = require('./routes/foodAnalysis');
const mealRoutes = require('./routes/meals');
const workoutsRoutes = require('./routes/workouts');
const userRoutes = require('./routes/users');
const nutritionRoutes = require('./routes/nutritionRoutes');

app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/food-analysis', foodAnalysisRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nutrition', nutritionRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.send('Fitness App Backend');
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).json({ message: 'Server error' });
});

// MongoDB Configuration
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
};

// Connect to MongoDB and Start Server
mongoose.connect(process.env.MONGO_URI, mongooseOptions)
.then(() => {
    console.log('MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});
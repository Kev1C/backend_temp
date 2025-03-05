// backend/functions/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const mealRoutes = require('./routes/mealRoutes');
const progressRoutes = require('./routes/progressRoutes');
const diamondRoutes = require('./routes/diamondRoutes');
const foodAnalysisRoutes = require('./routes/foodAnalysisRoutes');

// Initialize Supabase (for connection verification only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test Supabase connection
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful');
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
  }
};

// Create Express app
const app = express();

// URL rewriting middleware for requests starting with "/api/api"
app.use((req, res, next) => {
  if (req.url.startsWith("/api/api")) {
    req.url = req.url.replace("/api/api", "/api");
  }
  next();
});

// CORS configuration
app.use(cors({
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
}));
app.options('*', cors());

// Security and utility middleware
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());
app.use(morgan('dev'));

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ message: "Fitness App API is running" });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api-version', (req, res) => {
  res.status(200).json({ version: '1.0.0', database: 'supabase' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/diamonds', diamondRoutes);
app.use('/api/food-analysis', foodAnalysisRoutes);

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize connections on app startup
(async () => {
  await testSupabaseConnection();
})();

module.exports = app;

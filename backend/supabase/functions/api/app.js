// Convert all requires to import statements with npm: prefix
import express from 'npm:express';
import cors from 'npm:cors';
import morgan from 'npm:morgan';
import helmet from 'npm:helmet';
import compression from 'npm:compression';
import { createClient } from 'npm:@supabase/supabase-js';

// Routes - Note the .js extension is required for all imports
import authRoutes from '../supabase/functions/api/routes/authRoutes.js';
import userRoutes from '../supabase/functions/api/routes/userRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import mealRoutes from '../supabase/functions/api/routes/mealRoutes.js';
import progressRoutes from '../supabase/functions/api/routes/progressRoutes.js';
import diamondRoutes from '../supabase/functions/api/routes/diamondRoutes.js';
import foodAnalysisRoutes from '../supabase/functions/api/routes/foodAnalysisRoutes.js';

// Initialize Supabase - using Deno.env instead of process.env
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_KEY") || ""
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
    ...(Deno.env.get("NODE_ENV") === 'development' && { stack: err.stack })
  });
});

// Initialize Supabase connection on startup
testSupabaseConnection();

// Export the Express app using ES Module syntax
export default app;

//frontend/services/api.js
import axios from 'axios';
import Constants from 'expo-constants';
import { getCurrentSession } from './supabaseClient';

// Get the API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.API_URL || 'https://your-api-url.com/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const session = await getCurrentSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      return config;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Auth
  verifyToken: (token) => apiClient.post('/auth/verify', { token }),
  
  // User
  getCurrentUser: () => apiClient.get('/users/me'),
  updateUser: (userData) => apiClient.put('/users/me', userData),
  
  // Nutrition
  getDailyNutrition: (date) => apiClient.get(`/nutrition/daily?date=${date}`),
  getNutritionSummary: (params) => apiClient.get('/nutrition/summary', { params }),
  
  // Meals
  getMeals: (date) => apiClient.get(`/meals?date=${date}`),
  addMeal: (mealData) => apiClient.post('/meals', mealData),
  
  // Progress
  getProgress: () => apiClient.get('/progress'),
  addProgress: (progressData) => apiClient.post('/progress', progressData),
  
  // Diamonds
  getDiamondBalance: () => apiClient.get('/diamonds/balance'),
  addDiamonds: (amount) => apiClient.post('/diamonds/add', { amount }),
  deductDiamonds: (amount) => apiClient.post('/diamonds/deduct', { amount }),
  
  // Food analysis
  analyzeFood: (imageBase64) => apiClient.post('/food/analyze', { imageBase64 }),
  
  // Generic request method
  request: (method, url, data, config) => apiClient({ method, url, data, ...config }),
  
  // Export axios instance if needed for custom requests
  client: apiClient,
};

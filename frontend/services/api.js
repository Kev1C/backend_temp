// frontend/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import mitt from 'mitt';
import jwt_decode from 'jwt-decode';

// Initialize event emitter
const eventEmitter = mitt();

// Constants
const SIGNIN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const CSRF_TOKEN_KEY = 'csrfToken';
const MAX_REQUESTS_PER_MINUTE = 120; // Increased for social auth
const REQUEST_TIMEOUT = 15000; // Increased timeout
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes default cache TTL
const CACHE_TTL_AUTH = 1000 * 60 * 5; // 5 minutes cache for auth endpoints

// Rate limiting with better queue management
let requestCounter = 0;
let lastResetTime = Date.now();
const requestQueue = [];
let processingQueue = false;
let queueTimer = null;

// Enhanced cache system with memory management
const cache = {
  data: new Map(),
  timeouts: new Map(),
  maxSize: 200, // Increased cache size
  endpoints: {
    '/auth/me': CACHE_TTL_AUTH,
    '/auth/profile': CACHE_TTL_AUTH,
    '/auth/settings': CACHE_TTL_AUTH,
    '/social/profile': CACHE_TTL_AUTH
  }
};

// Optimized cache helper functions
const setCacheWithExpiry = (key, value, endpoint) => {
  if (!value) return;
  
  const ttl = cache.endpoints[endpoint] || CACHE_TTL;
  
  // Clear oldest entries if cache is full
  if (cache.data.size >= cache.maxSize) {
    const entriesToDelete = Array.from(cache.data.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, Math.ceil(cache.maxSize * 0.2)); // Remove 20% of oldest entries
      
    entriesToDelete.forEach(([k]) => {
      cache.data.delete(k);
      if (cache.timeouts.has(k)) {
        clearTimeout(cache.timeouts.get(k));
        cache.timeouts.delete(k);
      }
    });
  }
  
  const cacheData = {
    value,
    timestamp: Date.now(),
    etag: value?.etag
  };
  
  cache.data.set(key, cacheData);
  
  if (cache.timeouts.has(key)) {
    clearTimeout(cache.timeouts.get(key));
  }
  
  const timeout = setTimeout(() => {
    cache.data.delete(key);
    cache.timeouts.delete(key);
  }, ttl);
  
  cache.timeouts.set(key, timeout);
};

const getCache = (key, endpoint) => {
  const cached = cache.data.get(key);
  const ttl = cache.endpoints[endpoint] || CACHE_TTL;
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached;
  }
  return null;
};

// Improved request queue processor
const processQueue = async () => {
  if (processingQueue || requestQueue.length === 0) return;
  
  processingQueue = true;
  while (requestQueue.length > 0) {
    const { config, resolve, reject } = requestQueue.shift();
    
    try {
      const response = await axios(config);
      resolve(response);
    } catch (error) {
      if (error.response?.status === 429) { // Rate limit exceeded
        requestQueue.unshift({ config, resolve, reject }); // Put back in queue
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      reject(error);
    }
    
    // Add delay between requests to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  processingQueue = false;
};

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: `${Constants.expoConfig.extra.apiBaseUrl}/api`,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Optimized request interceptor
api.interceptors.request.use(async (config) => {
  const now = Date.now();
  
  // Reset counter if a minute has passed
  if (now - lastResetTime > 60000) {
    requestCounter = 0;
    lastResetTime = now;
  }

  // Check rate limit
  if (requestCounter >= MAX_REQUESTS_PER_MINUTE) {
    // Add to queue instead of rejecting
    return new Promise((resolve, reject) => {
      requestQueue.push({ config, resolve, reject });
      if (!queueTimer) {
        queueTimer = setTimeout(processQueue, 60000 - (now - lastResetTime));
      }
    });
  }

  try {
    // Get both tokens
    const [authToken, firebaseToken] = await Promise.all([
      SecureStore.getItemAsync(SIGNIN_KEY),
      SecureStore.getItemAsync('firebaseToken')
    ]);

    // For the /auth/verify-token endpoint, use Firebase token
    if (config.url === '/auth/verify-token') {
      if (firebaseToken) {
        config.headers['Firebase-Token'] = firebaseToken;
      }
    } 
    // For all other endpoints, use the backend JWT
    else if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Add cache control headers
    const endpoint = config.url.split('?')[0];
    if (cache.endpoints[endpoint]) {
      const cachedData = getCache(config.url, endpoint);
      if (cachedData?.etag) {
        config.headers['If-None-Match'] = cachedData.etag;
      }
    }

    requestCounter++;
    return config;
  } catch (error) {
    console.warn('Request interceptor error:', error);
    return config;
  }
}, error => Promise.reject(error));

// Optimized response interceptor
api.interceptors.response.use(
  response => {
    const endpoint = response.config.url.split('?')[0];
    
    // Cache successful GET requests
    if (response.config.method === 'get' && response.status === 200) {
      setCacheWithExpiry(
        response.config.url,
        response.data,
        endpoint
      );
    }
    
    return response;
  },
  async error => {
    if (error.response?.status === 304) {
      const endpoint = error.config.url.split('?')[0];
      const cachedData = getCache(error.config.url, endpoint);
      if (cachedData) {
        return { ...error.response, data: cachedData.value };
      }
    }

    if (error.response?.status === 401) {
      eventEmitter.emit('sessionExpired');
    }

    return Promise.reject(error);
  }
);

// Enhanced get method with caching
const cachedGet = async (url, config = {}) => {
  const endpoint = url.split('?')[0];
  const cacheKey = `${endpoint}-${JSON.stringify(config)}`;
  const cached = getCache(cacheKey, endpoint);
  
  if (cached) {
    return Promise.resolve({ data: cached.value, fromCache: true });
  }

  const response = await api.get(url, config);
  setCacheWithExpiry(cacheKey, response.data, endpoint);
  return response;
};

// Export the enhanced API instance and utilities
export { api, eventEmitter, cachedGet };
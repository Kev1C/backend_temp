// frontend/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import mitt from 'mitt';
import jwt_decode from 'jwt-decode';

const eventEmitter = mitt();

const SIGNIN_KEY = 'authToken';
const REQUEST_TIMEOUT = 15000;
const CACHE_TTL = 1000 * 60 * 15;
const CACHE_TTL_AUTH = 1000 * 60 * 5;

let requestCounter = 0;
let lastResetTime = Date.now();
const requestQueue = [];
let processingQueue = false;
let queueTimer = null;

const cache = {
  data: new Map(),
  timeouts: new Map(),
  maxSize: 200,
  endpoints: {
    '/auth/verify-token': CACHE_TTL_AUTH,
    '/users/me': CACHE_TTL_AUTH,
    '/auth/me': CACHE_TTL_AUTH,
    '/auth/profile': CACHE_TTL_AUTH,
    '/auth/settings': CACHE_TTL_AUTH,
    '/social/profile': CACHE_TTL_AUTH
  }
};

const setCacheWithExpiry = (key, value, endpoint) => {
  if (!value) return;
  
  const ttl = cache.endpoints[endpoint] || CACHE_TTL;
  
  if (cache.data.size >= cache.maxSize) {
    const entriesToDelete = Array.from(cache.data.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, Math.ceil(cache.maxSize * 0.2));
    entriesToDelete.forEach(([k]) => {
      cache.data.delete(k);
      if (cache.timeouts.has(k)) {
        clearTimeout(cache.timeouts.get(k));
        cache.timeouts.delete(k);
      }
    });
  }
  
  const cacheData = { value, timestamp: Date.now(), etag: value?.etag };
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

const pendingRequests = new Map();

const processQueue = async () => {
  if (processingQueue || requestQueue.length === 0) return;
  processingQueue = true;
  while (requestQueue.length > 0) {
    const { config, resolve, reject } = requestQueue.shift();
    try {
      const response = await axios(config);
      resolve(response);
    } catch (error) {
      if (error.response?.status === 429) {
        requestQueue.unshift({ config, resolve, reject });
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      reject(error);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  processingQueue = false;
};

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/fitness-app-bf54e/us-central1/api/api';
  }
  return 'http://127.0.0.1:5001/fitness-app-bf54e/us-central1/api/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

api.interceptors.request.use(async (config) => {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    requestCounter = 0;
    lastResetTime = now;
  }
  if (requestCounter >= 120) {
    return new Promise((resolve, reject) => {
      requestQueue.push({ config, resolve, reject });
      if (!queueTimer) {
        queueTimer = setTimeout(processQueue, 60000 - (now - lastResetTime));
      }
    });
  }
  try {
    const [authToken, firebaseToken] = await Promise.all([
      SecureStore.getItemAsync(SIGNIN_KEY),
      SecureStore.getItemAsync('firebaseToken')
    ]);
    if (config.url === '/auth/verify-token') {
      if (firebaseToken) {
        config.headers['Firebase-Token'] = firebaseToken;
        if (!config.data) config.data = {};
        config.data.includeOnboardingStatus = true;
        if (config.data.onboardingData) {
          config.data.syncOnboarding = true;
        }
      }
    } else if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
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

api.interceptors.response.use(
  response => {
    const endpoint = response.config.url.split('?')[0];
    if (response.config.method === 'get' && response.status === 200) {
      setCacheWithExpiry(response.config.url, response.data, endpoint);
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

api.request = async function(config) {
  const key = `${config.method}:${config.url}:${JSON.stringify(config.params || config.data)}`;
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const promise = axios.request(config).finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
};

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

export { api, eventEmitter, cachedGet };

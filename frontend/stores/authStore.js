// frontend/stores/authStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import jwtDecode from 'jwt-decode';
import { api, eventEmitter } from '../services/api';
import { auth, signInAsGuest } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from '@firebase/auth';

const SIGNIN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const FIREBASE_TOKEN_KEY = 'firebaseToken';
const USER_DATA_KEY = 'userData';
const USER_FETCH_INTERVAL = 300000; // 5 minutes

const authStore = create((set, get) => ({
  authToken: null,
  firebaseToken: null,
  user: null,
  loading: false,
  error: null,
  lastUserFetch: null,

  initializeAuth: async () => {
    try {
      set({ loading: true });
      const [storedToken, storedFirebaseToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(SIGNIN_KEY),
        SecureStore.getItemAsync(FIREBASE_TOKEN_KEY),
        SecureStore.getItemAsync(USER_DATA_KEY)
      ]);

      if (storedToken && storedFirebaseToken && storedUser) {
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000;

        if (decoded.exp && decoded.exp > now) {
          set({
            authToken: storedToken,
            firebaseToken: storedFirebaseToken,
            user: JSON.parse(storedUser),
            loading: false,
          });

          // Set up refresh timer
          setTimeout(
            get().refreshAccessToken,
            (decoded.exp * 1000) - Date.now() - 60000
          );
        } else {
          // Token expired, try refresh
          await get().refreshAccessToken();
        }
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error initializing auth:', error);
    }
  },

  authenticateWithBackend: async (fbToken) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/auth/verify-token', {
        firebaseToken: fbToken
      });

      if (response.status !== 200) {
        throw new Error('Failed to authenticate with backend.');
      }

      const { token: backendToken, refreshToken, user: userData } = response.data;

      // Ensure all values stored in SecureStore are strings
      await Promise.all([
        SecureStore.setItemAsync(SIGNIN_KEY, backendToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
        SecureStore.setItemAsync(FIREBASE_TOKEN_KEY, fbToken),
        SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
      ]);

      set({
        authToken: backendToken,
        firebaseToken: fbToken,
        user: userData,
        loading: false,
      });

      // Set up token refresh
      const decoded = jwtDecode(backendToken);
      setTimeout(
        get().refreshAccessToken,
        (decoded.exp * 1000) - Date.now() - 60000
      );

      return backendToken;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw new Error('Authentication failed: ' + error.message);
    }
  },

  signInWithGoogle: async (idToken) => {
    try {
      set({ loading: true, error: null });
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const fbToken = await result.user.getIdToken();
      await get().authenticateWithBackend(fbToken);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw new Error('Google sign in failed: ' + error.message);
    }
  },

  signInAnonymously: async () => {
    try {
      set({ loading: true, error: null });
      const result = await signInAsGuest();
      const fbToken = await result.user.getIdToken();
      await get().authenticateWithBackend(fbToken);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw new Error('Guest sign in failed: ' + error.message);
    }
  },

  refreshAccessToken: async () => {
    try {
      set({ loading: true, error: null });
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      if (!response.data || !response.data.token || !response.data.refreshToken) {
        throw new Error('Invalid response from refresh endpoint');
      }

      const { token: newToken, refreshToken: newRefreshToken } = response.data;
      if (typeof newToken !== 'string' || typeof newRefreshToken !== 'string') {
        throw new Error('Token received is not a string');
      }

      // Ensure all values stored in SecureStore are strings
      await Promise.all([
        SecureStore.setItemAsync(SIGNIN_KEY, newToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken)
      ]);

      set({
        authToken: newToken,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error refreshing token:', error);
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await Promise.all([
        SecureStore.deleteItemAsync(SIGNIN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(FIREBASE_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
      ]);
      set({
        authToken: null,
        firebaseToken: null,
        user: null,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUserData: async (force = false) => {
    const { lastUserFetch } = get();
    if (!force && lastUserFetch && Date.now() - lastUserFetch < USER_FETCH_INTERVAL) {
      return;
    }

    try {
      set({ loading: true, error: null });
      const response = await api.get('/user/profile');
      const userData = response.data;

      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
      set({
        user: userData,
        lastUserFetch: Date.now(),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

export const useAuthStore = () => authStore();

// Export individual actions and state for direct access
export const {
  getState,
  setState,
  subscribe
} = authStore;

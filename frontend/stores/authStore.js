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

export const useAuthStore = create((set, get) => ({
  authToken: null,
  firebaseToken: null,
  user: null,
  loading: true,
  lastUserFetch: null,

  initializeAuth: async () => {
    try {
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
            loading: false
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
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.warn('Auth initialization error:', error);
      set({ loading: false });
    }
  },

  authenticateWithBackend: async (fbToken) => {
    try {
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
        user: userData
      });

      return backendToken;
    } catch (error) {
      console.error('Backend authentication error:', error);
      throw new Error('Authentication failed: ' + error.message);
    }
  },

  signInWithGoogle: async (idToken) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const fbToken = await userCredential.user.getIdToken();
      return await get().authenticateWithBackend(fbToken);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw new Error('Google sign in failed: ' + error.message);
    }
  },

  signInAnonymously: async () => {
    try {
      const userCredential = await signInAsGuest();
      const fbToken = await userCredential.user.getIdToken();
      const backendToken = await get().authenticateWithBackend(fbToken);

      set(state => ({
        user: { ...state.user, isGuest: true }
      }));

      return backendToken;
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      throw new Error('Guest sign in failed: ' + error.message);
    }
  },

  signIn: async (token, userData) => {
    try {
      // Ensure all values stored in SecureStore are strings
      await Promise.all([
        SecureStore.setItemAsync(SIGNIN_KEY, token),
        SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
      ]);

      set({
        authToken: token,
        user: userData
      });

      // Set up token refresh
      const decoded = jwtDecode(token);
      setTimeout(
        get().refreshAccessToken,
        (decoded.exp * 1000) - Date.now() - 60000
      );
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error('Sign in failed: ' + error.message);
    }
  },

  refreshAccessToken: async () => {
    try {
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

      set({ authToken: newToken });
    } catch (error) {
      console.error('Error refreshing token:', error);
      await get().signOut();
    }
  },

  signOut: async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();

      set({
        authToken: null,
        firebaseToken: null,
        user: null
      });

      // Clear all auth-related data
      await Promise.all([
        SecureStore.deleteItemAsync(SIGNIN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(FIREBASE_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
      ]);
    } catch (error) {
      console.error('Error during sign-out:', error);
      Alert.alert('Error', 'Failed to log out.');
    }
  },

  updateUserData: async (force = false) => {
    try {
      const now = Date.now();
      if (!force && get().lastUserFetch && (now - get().lastUserFetch < USER_FETCH_INTERVAL)) {
        return;
      }

      const cachedUser = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (!force && cachedUser) {
        set({ user: JSON.parse(cachedUser) });
      }

      const response = await api.get('/auth/me');
      const userData = response.data;

      set({
        user: userData,
        lastUserFetch: now
      });

      // Ensure all values stored in SecureStore are strings
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error updating user ', error);
      // Don't throw error to prevent app crashes
    }
  },

  validateToken: (token) => {
    try {
      if (!token || token.split('.').length !== 3) return false;
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}));

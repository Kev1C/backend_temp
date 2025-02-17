// frontend/stores/authStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import jwtDecode from 'jwt-decode';
import { api, eventEmitter } from '../services/api';
import { auth, signInAsGuest } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from '@firebase/auth';
import { useOnboardingStore } from './onboardingStore';

const SIGNIN_KEY = 'authToken';
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

  // Method to ensure the token is valid before making API calls
  ensureValidToken: async () => {
    const { authToken, firebaseToken } = get();
    if (!authToken || !auth.currentUser) return;

    const decoded = jwtDecode(authToken);
    // If token is about to expire, force refresh Firebase token
    if (decoded.exp * 1000 < Date.now() + 300000) {
      try {
        const newFirebaseToken = await auth.currentUser.getIdToken(true);
        await get().authenticateWithBackend(newFirebaseToken);
      } catch (error) {
        console.error('Error refreshing token:', error);
        // If token refresh fails, sign out user
        await get().signOut();
      }
    }
  },

  initializeAuth: async () => {
    try {
      set({ loading: true });
      const storageKeys = [SIGNIN_KEY, FIREBASE_TOKEN_KEY, USER_DATA_KEY];
      const [storedToken, storedFirebaseToken, storedUser] = await Promise.all(
        storageKeys.map(k => SecureStore.getItemAsync(k))
      );

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

          // Set up validity check timer
          setTimeout(
            get().ensureValidToken,
            (decoded.exp * 1000) - Date.now() - 300000
          );
        } else {
          // Token expired, force a new Firebase token
          if (auth.currentUser) {
            const newFirebaseToken = await auth.currentUser.getIdToken(true);
            await get().authenticateWithBackend(newFirebaseToken);
          }
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

      let { token, user: userData } = response.data;

      await Promise.all([
        SecureStore.setItemAsync(SIGNIN_KEY, token),
        SecureStore.setItemAsync(FIREBASE_TOKEN_KEY, fbToken),
        SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
      ]);

      set({
        authToken: token,
        firebaseToken: fbToken,
        user: userData,
        loading: false,
      });

      // Set up token validity check
      const decoded = jwtDecode(token);
      setTimeout(
        get().ensureValidToken,
        (decoded.exp * 1000) - Date.now() - 300000
      );

      // Check if onboarding data needs to be synced
      const { userUpdated } = await useOnboardingStore.getState().loadOnboardingData();

      if (userUpdated) {
        // Force new Firebase token and regenerate backend token
        const newFbToken = await auth.currentUser.getIdToken(true);
        const regenerateResponse = await api.post('/auth/verify-token', {
          firebaseToken: newFbToken
        });

        if (regenerateResponse.status !== 200) {
          throw new Error('Failed to regenerate token after onboarding update.');
        }

        token = regenerateResponse.data.token;
        userData = regenerateResponse.data.user;

        await Promise.all([
          SecureStore.setItemAsync(SIGNIN_KEY, token),
          SecureStore.setItemAsync(FIREBASE_TOKEN_KEY, newFbToken),
          SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
        ]);

        set({
          authToken: token,
          firebaseToken: newFbToken,
          user: userData,
        });
      }

      return token;
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
      const fbToken = await result.user.getIdToken(true);
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
      const fbToken = await result.user.getIdToken(true);
      await get().authenticateWithBackend(fbToken);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw new Error('Guest sign in failed: ' + error.message);
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await Promise.all([
        SecureStore.deleteItemAsync(SIGNIN_KEY),
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
      const response = await api.get('/users/me');
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

export const useAuthStore = authStore;

export const {
  getState,
  setState,
  subscribe,
  ensureValidToken,
} = authStore;
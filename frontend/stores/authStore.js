// frontend/stores/authStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Alert, AppState } from 'react-native';
import jwtDecode from 'jwt-decode';
import { api, eventEmitter } from '../services/api';
import { auth, signInAsGuest } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from '@firebase/auth';

const SIGNIN_KEY = 'authToken';
const FIREBASE_TOKEN_KEY = 'firebaseToken';
const USER_DATA_KEY = 'userData';
// Extend user fetch interval to 10 minutes (600000 ms)
const USER_FETCH_INTERVAL = 600000; 
const TOKEN_REFRESH_MARGIN = 60000; // 1 minute margin

const authStore = create((set, get) => ({
  authToken: null,
  firebaseToken: null,
  user: null,
  loading: false,
  error: null,
  lastUserFetch: null,
  pendingAuth: null,
  refreshTimeout: null, // For tracking the scheduled refresh

  clearRefreshTimeout: () => {
    const { refreshTimeout } = get();
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      set({ refreshTimeout: null });
    }
  },

  scheduleTokenRefresh: (expirationTime) => {
    get().clearRefreshTimeout();
    // Check app state – only schedule if the app is active
    if (AppState.currentState !== 'active') {
      return;
    }
    const timeLeft = expirationTime * 1000 - Date.now() - TOKEN_REFRESH_MARGIN;
    if (timeLeft > 0) {
      const timeout = setTimeout(get().ensureValidToken, timeLeft);
      set({ refreshTimeout: timeout });
    } else {
      get().ensureValidToken();
    }
  },

  ensureValidToken: async () => {
    const { authToken, pendingAuth } = get();

    if (pendingAuth) {
      return pendingAuth;
    }

    if (!authToken || !auth.currentUser) {
      return;
    }

    const decoded = jwtDecode(authToken);
    if (decoded.exp * 1000 < Date.now() + TOKEN_REFRESH_MARGIN) {
      const refreshPromise = (async () => {
        try {
          const newFirebaseToken = await auth.currentUser.getIdToken(true);
          return await get().refreshTokenAndSyncOnboarding(newFirebaseToken);
        } catch (error) {
          console.error('Error refreshing token:', error);
          await get().signOut();
          throw error;
        } finally {
          set({ pendingAuth: null });
        }
      })();
      set({ pendingAuth: refreshPromise });
      return refreshPromise;
    }
  },

  refreshTokenAndSyncOnboarding: async (firebaseToken) => {
    try {
      set({ loading: true, error: null });
      
      // Combine token verification and potential onboarding sync
      const response = await api.post('/auth/verify-token', {
        firebaseToken,
        includeOnboardingStatus: true, // Request onboarding status
        // If there is onboarding data available from your onboardingStore, include it:
        // (Assuming you have a similar store or method to get onboardingData)
        ...(get().onboardingData ? { onboardingData: get().onboardingData } : {})
      });

      if (response.status !== 200) {
        throw new Error('Token verification failed.');
      }

      let { token, user: userData, onboardingNeedsSync } = response.data;

      // If onboarding needs sync, call verify-token again with onboarding sync flag
      if (onboardingNeedsSync) {
        const newFirebaseToken = await auth.currentUser.getIdToken(true);
        const regenResponse = await api.post('/auth/verify-token', {
          firebaseToken: newFirebaseToken,
          syncOnboarding: true,
          // Include actual onboarding data as necessary:
          onboardingData: get().onboardingData || {}
        });

        if (regenResponse.status !== 200) {
          throw new Error('Failed to regenerate token after onboarding update.');
        }

        token = regenResponse.data.token;
        userData = regenResponse.data.user;
        firebaseToken = newFirebaseToken;
      }

      // --- Batch SecureStore operations ---
      await Promise.all([
        SecureStore.setItemAsync(SIGNIN_KEY, token),
        SecureStore.setItemAsync(FIREBASE_TOKEN_KEY, firebaseToken),
        SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
      ]);

      set({
        authToken: token,
        firebaseToken,
        user: userData,
        lastUserFetch: Date.now()
      });

      // Schedule next token refresh
      const decoded = jwtDecode(token);
      get().scheduleTokenRefresh(decoded.exp);

      return token;
    } catch (error) {
      set({ error: error.message });
      throw new Error('Authentication failed: ' + error.message);
    } finally {
      set({ loading: false });
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
          });

          get().scheduleTokenRefresh(decoded.exp);
        } else if (auth.currentUser) {
          const newFirebaseToken = await auth.currentUser.getIdToken(true);
          await get().refreshTokenAndSyncOnboarding(newFirebaseToken);
        }
      }
    } catch (error) {
      set({ error: error.message });
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async (idToken) => {
    try {
      set({ loading: true, error: null });
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const fbToken = await result.user.getIdToken(true);
      return await get().refreshTokenAndSyncOnboarding(fbToken);
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
      return await get().refreshTokenAndSyncOnboarding(fbToken);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw new Error('Guest sign in failed: ' + error.message);
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      get().clearRefreshTimeout();
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
        lastUserFetch: null
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUserData: async (force = false) => {
    const { lastUserFetch, pendingAuth } = get();

    if (pendingAuth) {
      await pendingAuth;
    }

    if (!force && lastUserFetch && Date.now() - lastUserFetch < USER_FETCH_INTERVAL) {
      return;
    }

    try {
      set({ loading: true, error: null });
      await get().ensureValidToken();
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
  }
}));

export const useAuthStore = authStore;

export const {
  getState,
  setState,
  subscribe,
  ensureValidToken,
} = authStore;

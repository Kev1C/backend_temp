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
      
      // Simple verification request - no complex onboarding sync here
      const response = await api.post('/auth/verify-token', {
        firebaseToken,
        includeOnboardingStatus: true
      });

      if (response.status !== 200) {
        throw new Error('Token verification failed.');
      }

      const { token, user: userData } = response.data;

      // Update state immediately for UI to proceed
      set({
        authToken: token,
        firebaseToken,
        user: userData,
        lastUserFetch: Date.now()
      });

      // Batch SecureStore operations in background
      Promise.all([
        SecureStore.setItemAsync(SIGNIN_KEY, token),
        SecureStore.setItemAsync(FIREBASE_TOKEN_KEY, firebaseToken),
        SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
      ]).catch(err => console.warn('Error in background token storage:', err));

      // Schedule next token refresh in background
      const decoded = jwtDecode(token);
      setTimeout(() => get().scheduleTokenRefresh(decoded.exp), 0);

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
      
      // Fast path: just check if we have a token
      const storedToken = await SecureStore.getItemAsync(SIGNIN_KEY);
      
      if (storedToken) {
        // Do a quick decode - don't validate yet
        try {
          const decoded = jwtDecode(storedToken);
          const now = Date.now() / 1000;
          
          if (decoded.exp && decoded.exp > now) {
            // Token looks valid - set it immediately to unblock UI
            set({ authToken: storedToken });
            
            // Fetch the rest in the background
            Promise.all([
              SecureStore.getItemAsync(FIREBASE_TOKEN_KEY),
              SecureStore.getItemAsync(USER_DATA_KEY)
            ]).then(([storedFirebaseToken, storedUser]) => {
              if (storedFirebaseToken && storedUser) {
                set({
                  firebaseToken: storedFirebaseToken,
                  user: JSON.parse(storedUser)
                });
                
                // Schedule refresh in background
                setTimeout(() => {
                  get().scheduleTokenRefresh(decoded.exp);
                }, 0);
              } else if (auth.currentUser) {
                // Missing some data but user is logged in
                auth.currentUser.getIdToken(true)
                  .then(newFirebaseToken => 
                    get().refreshTokenAndSyncOnboarding(newFirebaseToken))
                  .catch(err => console.warn('Background token refresh failed:', err));
              }
            }).catch(err => console.warn('Error loading auth data:', err));
          } else if (auth.currentUser) {
            // Token expired but user is logged in
            setTimeout(() => {
              auth.currentUser.getIdToken(true)
                .then(newFirebaseToken => 
                  get().refreshTokenAndSyncOnboarding(newFirebaseToken))
                .catch(err => console.warn('Background token refresh failed:', err));
            }, 0);
          }
        } catch (decodeError) {
          console.warn('Error decoding token:', decodeError);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ error: error.message });
    } finally {
      // Always mark as not loading to unblock UI
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

  signInAnonymously: async (userCredential) => {
    try {
      set({ loading: true, error: null });
      
      // Check if there's already a pending auth operation
      const pendingAuth = get().pendingAuth;
      if (pendingAuth) {
        await pendingAuth;
        set({ loading: false });
        return;
      }
      
      // Get user credentials - either passed in or sign in as guest
      const result = userCredential || await signInAsGuest();
      const fbToken = await result.user.getIdToken(true);
      
      // Create a simpler auth process that completes faster
      const authPromise = (async () => {
        try {
          const response = await api.post('/auth/verify-token', {
            firebaseToken: fbToken,
            includeOnboardingStatus: true
          });
          
          if (response.status !== 200) {
            throw new Error('Token verification failed.');
          }
          
          const { token, user: userData } = response.data;
          
          // Update state immediately for UI
          set({
            authToken: token,
            firebaseToken: fbToken,
            user: userData,
            lastUserFetch: Date.now()
          });
          
          // Storage operations happen in background
          Promise.all([
            SecureStore.setItemAsync(SIGNIN_KEY, token),
            SecureStore.setItemAsync(FIREBASE_TOKEN_KEY, fbToken),
            SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
          ]).catch(err => console.warn('Background storage error:', err));
          
          // Schedule refresh in background
          const decoded = jwtDecode(token);
          setTimeout(() => get().scheduleTokenRefresh(decoded.exp), 0);
          
          return token;
        } finally {
          set({ pendingAuth: null });
        }
      })();
      
      set({ pendingAuth: authPromise });
      return await authPromise;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw new Error('Guest sign in failed: ' + error.message);
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      get().clearRefreshTimeout();
      
      // Set auth state to null immediately so UI can react
      set({
        authToken: null,
        firebaseToken: null,
        user: null,
      });
      
      // Clean up storage in background
      Promise.all([
        SecureStore.deleteItemAsync(SIGNIN_KEY),
        SecureStore.deleteItemAsync(FIREBASE_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
      ]).catch(err => console.warn('Error cleaning up auth storage:', err));
      
      set({ loading: false, lastUserFetch: null });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUserData: async (force = false) => {
    const { lastUserFetch, pendingAuth, authToken } = get();

    // Don't update if we don't have a token
    if (!authToken) return;

    if (pendingAuth) {
      await pendingAuth;
    }

    // Skip if recently fetched (unless forced)
    if (!force && lastUserFetch && Date.now() - lastUserFetch < USER_FETCH_INTERVAL) {
      return;
    }

    try {
      set({ loading: true, error: null });
      
      // Ensure token is valid
      await get().ensureValidToken();
      
      // Fetch user data
      const response = await api.get('/users/me');
      const userData = response.data;

      // Update state immediately
      set({
        user: userData,
        lastUserFetch: Date.now(),
        loading: false,
      });
      
      // Store in background
      SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
        .catch(err => console.warn('Error storing user data:', err));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Helper to check if user is a guest
  isGuest: () => {
    const { user } = get();
    return user?.type === 'guest' || false;
  }
}));

export const useAuthStore = authStore;

export const {
  getState,
  setState,
  subscribe,
  ensureValidToken,
} = authStore;

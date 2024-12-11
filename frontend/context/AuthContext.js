// frontend/context/AuthContext.js

import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import jwtDecode from 'jwt-decode';
import { api, eventEmitter } from '../services/api';
import { auth, getFirebaseToken, signInAsGuest } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from '@firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [firebaseToken, setFirebaseToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenRefreshTimeout, setTokenRefreshTimeout] = useState(null);
  const [lastUserFetch, setLastUserFetch] = useState(null);
  const USER_FETCH_INTERVAL = 300000; // 5 minutes

  const SIGNIN_KEY = 'authToken';
  const REFRESH_TOKEN_KEY = 'refreshToken';
  const FIREBASE_TOKEN_KEY = 'firebaseToken';
  const USER_DATA_KEY = 'userData';

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
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
            setAuthToken(storedToken);
            setFirebaseToken(storedFirebaseToken);
            setUser(JSON.parse(storedUser));
            
            // Set up refresh timer
            const timeoutId = setTimeout(
              () => refreshAccessToken(),
              (decoded.exp * 1000) - Date.now() - 60000
            );
            setTokenRefreshTimeout(timeoutId);
          } else {
            // Token expired, try refresh
            await refreshAccessToken();
          }
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Memoize functions to prevent unnecessary re-renders
  const authenticateWithBackend = useCallback(async (fbToken) => {
    try {
      const response = await api.post('/auth/verify-token', {
        firebaseToken: fbToken
      });
      
      const { token: backendToken, refreshToken, user: userData } = response.data;
      
      await Promise.all([
        SecureStore.setItemAsync(SIGNIN_KEY, backendToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
        SecureStore.setItemAsync(FIREBASE_TOKEN_KEY, fbToken),
        SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData))
      ]);
      
      setAuthToken(backendToken);
      setFirebaseToken(fbToken);
      setUser(userData);
      
      return backendToken;
    } catch (error) {
      console.error('Backend authentication error:', error);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async (idToken) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const fbToken = await userCredential.user.getIdToken();
      return await authenticateWithBackend(fbToken);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }, [authenticateWithBackend]);

  const signInAnonymously = useCallback(async () => {
    try {
      const userCredential = await signInAsGuest();
      const fbToken = await userCredential.user.getIdToken();
      return await authenticateWithBackend(fbToken);
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      throw error;
    }
  }, [authenticateWithBackend]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const response = await api.post('/auth/refresh', { refreshToken });
      const { token: newToken, refreshToken: newRefreshToken } = response.data;
      await Promise.all([
        SecureStore.setItemAsync(SIGNIN_KEY, newToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken)
      ]);
      setAuthToken(newToken);
    } catch (error) {
      console.error('Error refreshing token:', error);
      await signOut();
    }
  }, [signOut]);

  const signOut = useCallback(async () => {
    try {
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
      }
      
      // Sign out from Firebase
      await auth.signOut();
      
      setAuthToken(null);
      setFirebaseToken(null);
      setUser(null);

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
  }, [tokenRefreshTimeout]);

  // Add updateUserData function with throttling and proper error handling
  const updateUserData = useCallback(async (force = false) => {
    try {
      const now = Date.now();
      if (!force && lastUserFetch && (now - lastUserFetch < USER_FETCH_INTERVAL)) {
        return;
      }

      const cachedUser = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (!force && cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      const response = await api.get('/auth/me');
      const userData = response.data;
      
      setUser(userData);
      setLastUserFetch(now);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error updating user data:', error);
      // Don't throw error to prevent app crashes
    }
  }, [lastUserFetch]);

  // Token validation function with proper error handling
  const validateToken = useCallback((token) => {
    try {
      if (!token || token.split('.').length !== 3) return false;
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [{ text: 'OK', onPress: () => signOut() }]
      );
    };
    eventEmitter.on('sessionExpired', handleSessionExpired);
    return () => eventEmitter.off('sessionExpired', handleSessionExpired);
  }, [signOut]);

  useEffect(() => {
    if (authToken && !user) {
      updateUserData(true);
    }
  }, [authToken, user, updateUserData]);

  return (
    <AuthContext.Provider
      value={{
        signInWithGoogle,
        signInAnonymously,
        signOut,
        authToken,
        firebaseToken,
        user,
        loading,
        updateUserData,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

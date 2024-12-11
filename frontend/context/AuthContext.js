// frontend/context/AuthContext.js

import React, { createContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const {
    initializeAuth,
    signIn,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    updateUserData,
    validateToken,
    authToken,
    user,
    loading
  } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
        signIn,
        signInWithGoogle,
        signInAnonymously,
        signOut,
        updateUserData,
        validateToken,
        authToken,
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';

export const OnboardingContext = createContext();

export const OnboardingProvider = ({ children, navigation }) => {
  const { user, signInAnonymously } = useAuthStore();
  const [onboardingData, setOnboardingData] = useState({
    gender: null,
    height: null,
    weight: null,
    fitnessGoal: null,
    isOnboardingComplete: false,
  });

  const ONBOARDING_DATA_KEY = 'onboardingData';
  const GUEST_ONBOARDING_DATA_KEY = 'guestOnboardingData';

  // Load onboarding data from storage on mount
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const key = user?.isGuest ? GUEST_ONBOARDING_DATA_KEY : ONBOARDING_DATA_KEY;
        const storedData = await SecureStore.getItemAsync(key);
        if (storedData) {
          setOnboardingData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Error loading onboarding ', error);
      }
    };

    if (user) {
      loadOnboardingData();
    }
  }, [user]);

  const saveOnboardingData = async (data) => {
    try {
      const key = user?.isGuest ? GUEST_ONBOARDING_DATA_KEY : ONBOARDING_DATA_KEY;
      await SecureStore.setItemAsync(key, JSON.stringify(data));
      setOnboardingData(data);

      // If user exists, update their profile
      if (user) {
        await api.post('/user/profile', {
          ...data,
          userId: user.id
        });
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  };

  const completeOnboarding = async (data) => {
    try {
      const updatedData = {
        ...data,
        isOnboardingComplete: true
      };
      await saveOnboardingData(updatedData);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const startGuestOnboarding = async () => {
    try {
      await signInAnonymously();
      return true;
    } catch (error) {
      console.error('Error during onboarding:', error);
      throw error;
    }
  };

  const clearOnboardingData = async () => {
    try {
      await SecureStore.deleteItemAsync(ONBOARDING_DATA_KEY);
      await SecureStore.deleteItemAsync(GUEST_ONBOARDING_DATA_KEY);
      setOnboardingData({
        gender: null,
        height: null,
        weight: null,
        fitnessGoal: null,
        isOnboardingComplete: false,
      });
    } catch (error) {
      console.error('Error clearing onboarding data:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        saveOnboardingData,
        completeOnboarding,
        startGuestOnboarding,
        clearOnboardingData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
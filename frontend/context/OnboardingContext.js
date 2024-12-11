import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from './AuthContext';
import { api } from '../services/api';

export const OnboardingContext = createContext();

export const OnboardingProvider = ({ children, navigation }) => {
  const { signIn, user } = useContext(AuthContext);
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

    loadOnboardingData();
  }, [user]);

  const updateOnboardingData = async (newData) => {
    return new Promise(async (resolve) => {
      setOnboardingData(prevData => {
        const updatedData = { ...prevData, ...newData };
        const key = user?.isGuest ? GUEST_ONBOARDING_DATA_KEY : ONBOARDING_DATA_KEY;
        // Store updated data in SecureStore
        SecureStore.setItemAsync(key, JSON.stringify(updatedData));
        resolve(updatedData);
        return updatedData;
      });
    });
  };

  const validateOnboardingData = () => {
    const { gender, height, weight, fitnessGoal } = onboardingData;
    return Boolean(gender && height && weight && fitnessGoal);
  };

  const completeOnboarding = async (authData = {}) => {
    try {
      const { gender, height, weight, fitnessGoal } = onboardingData;

      if (!gender || !height || !weight || !fitnessGoal) {
        throw new Error('Incomplete onboarding data');
      }

      // Merge onboarding data with authData
      const profileData = {
        ...onboardingData,
        isOnboardingComplete: true,
      };

      if (authData && authData.type !== 'guest') {
        // Update existing user's profile
        profileData.id = authData.id;
        profileData.email = authData.email;
        profileData.provider = authData.provider || 'email';

        await api.put('/auth/profile', profileData, {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        });
      } else {
        // For guest users, just update the onboarding data in SecureStore
        const key = GUEST_ONBOARDING_DATA_KEY;
        await SecureStore.setItemAsync(key, JSON.stringify(profileData));
      }

      // Mark onboarding as complete
      setOnboardingData(profileData);

      // Sign in if not a guest
      if (authData && authData.type !== 'guest') {
        await signIn(authData.token, { ...authData, ...profileData });
      }

      return profileData;
    } catch (error) {
      console.error('Onboarding error:', error);
      throw error;
    }
  };

  const resetOnboardingData = async () => {
    const initialData = {
      gender: null,
      height: null,
      weight: null,
      fitnessGoal: null,
      isOnboardingComplete: false,
    };
    setOnboardingData(initialData);
    const key = user?.isGuest ? GUEST_ONBOARDING_DATA_KEY : ONBOARDING_DATA_KEY;
    await SecureStore.deleteItemAsync(key);
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        updateOnboardingData,
        completeOnboarding,
        resetOnboardingData,
        validateOnboardingData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
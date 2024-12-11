import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from './AuthContext';
import { api } from '../services/api';

export const OnboardingContext = createContext();

export const OnboardingProvider = ({ children, navigation }) => {
  const { signIn } = useContext(AuthContext);
  const [onboardingData, setOnboardingData] = useState({
    gender: null,
    height: null,
    weight: null,
    fitnessGoal: null,
    isOnboardingComplete: false,
  });

  const ONBOARDING_DATA_KEY = 'onboardingData';

  // Load onboarding data from storage on mount
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const storedData = await SecureStore.getItemAsync(ONBOARDING_DATA_KEY);
        if (storedData) {
          setOnboardingData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      }
    };

    loadOnboardingData();
  }, []);

  const updateOnboardingData = async (newData) => {
    return new Promise(async (resolve) => {
      setOnboardingData(prevData => {
        const updatedData = { ...prevData, ...newData };
        // Store updated data in SecureStore
        SecureStore.setItemAsync(ONBOARDING_DATA_KEY, JSON.stringify(updatedData));
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
        id: authData?.id, // Use existing ID if available
        email: authData?.email, // Use existing email if available
        provider: authData?.provider || 'email', // Default to 'email' if not provided
        isOnboardingComplete: true,
      };

      // If user is a guest, register them first
      if (authData && authData.type === 'guest') {
        const response = await api.post('/auth/register', {
          type: 'guest',
          userData: profileData,
        });

        // Get the token from registration response
        const { token } = response.data;

        // Sign in with the new token
        await signIn(token);
      } else {
        // Update AuthContext with profile data
        await signIn(authData.token, profileData);
      }

      // Update profile with onboarding data
      await api.put('/auth/profile', profileData, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

        // Get the token from registration response
        const { token } = response.data;
        
      // Mark onboarding as complete and store in SecureStore
      const updatedOnboardingData = {
        ...onboardingData,
        isOnboardingComplete: true,
      };
      setOnboardingData(updatedOnboardingData);
      await SecureStore.setItemAsync(
        ONBOARDING_DATA_KEY,
        JSON.stringify(updatedOnboardingData)
      );

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
    await SecureStore.deleteItemAsync(ONBOARDING_DATA_KEY);
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

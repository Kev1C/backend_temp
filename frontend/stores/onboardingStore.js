// frontend/stores/onboardingStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_DATA_KEY = 'onboardingData';

// Helper function to check if all required fields are present
const checkOnboardingComplete = (data) => {
  if (!data) return false;
  return Boolean(
    data.gender &&
    data.height &&
    data.weight &&
    data.activityLevel &&
    (data.goal || data.fitnessGoal)
  );
};

// Batch updates to reduce re-renders
const batchedUpdate = (set, updates) => {
  set((state) => ({
    ...state,
    ...updates
  }));
};

export const useOnboardingStore = create((set, get) => ({
  onboardingData: null,
  isOnboardingComplete: false,
  loading: false,
  error: null,

  saveOnboardingData: async (data) => {
    batchedUpdate(set, { loading: true, error: null });
    
    try {
      const currentData = get().onboardingData || {};
      const updatedData = { ...currentData, ...data };
      const isComplete = checkOnboardingComplete(updatedData);
      
      // Update state immediately for better UX
      batchedUpdate(set, {
        onboardingData: updatedData,
        isOnboardingComplete: isComplete,
        loading: false
      });

      // Save to secure storage asynchronously
      await SecureStore.setItemAsync(
        ONBOARDING_DATA_KEY,
        JSON.stringify(updatedData)
      );
      
      return isComplete;
    } catch (error) {
      batchedUpdate(set, {
        error: 'Failed to save onboarding data',
        loading: false
      });
      throw error;
    }
  },

  completeOnboarding: async () => {
    batchedUpdate(set, { loading: true, error: null });
    
    try {
      const currentData = get().onboardingData;
      if (!currentData) {
        throw new Error('No onboarding data available');
      }

      const isComplete = checkOnboardingComplete(currentData);
      if (!isComplete) {
        throw new Error('Missing required onboarding data');
      }

      const updatedData = {
        ...currentData,
        goal: currentData.goal || currentData.fitnessGoal,
        isComplete: true
      };

      // Update state immediately
      batchedUpdate(set, {
        onboardingData: updatedData,
        isOnboardingComplete: true,
        loading: false
      });

      // Save to secure storage asynchronously
      await SecureStore.setItemAsync(
        ONBOARDING_DATA_KEY,
        JSON.stringify(updatedData)
      );
    } catch (error) {
      console.error('Error completing onboarding:', error);
      batchedUpdate(set, {
        error: 'Failed to complete onboarding',
        loading: false
      });
      throw error;
    }
  },

  loadOnboardingData: async () => {
    batchedUpdate(set, { loading: true, error: null });
    
    try {
      const storedData = await SecureStore.getItemAsync(ONBOARDING_DATA_KEY);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        const isComplete = checkOnboardingComplete(parsedData);
        
        batchedUpdate(set, {
          onboardingData: parsedData,
          isOnboardingComplete: isComplete,
          loading: false
        });
      } else {
        batchedUpdate(set, { onboardingData: null, loading: false });
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      batchedUpdate(set, {
        error: 'Failed to load onboarding data',
        loading: false
      });
    }
  },

  resetOnboarding: async () => {
    try {
      await SecureStore.deleteItemAsync(ONBOARDING_DATA_KEY);
      batchedUpdate(set, { 
        onboardingData: null, 
        isOnboardingComplete: false,
        loading: false,
        error: null 
      });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      batchedUpdate(set, {
        error: 'Failed to reset onboarding data'
      });
      throw error;
    }
  }
}));

// frontend/stores/onboardingStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_DATA_KEY = 'onboardingData';
const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';

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
      
      // Save both the data and completion status
      await Promise.all([
        SecureStore.setItemAsync(ONBOARDING_DATA_KEY, JSON.stringify(updatedData)),
        SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, JSON.stringify(isComplete))
      ]);

      // Update state
      batchedUpdate(set, {
        onboardingData: updatedData,
        isOnboardingComplete: isComplete,
        loading: false
      });
    } catch (error) {
      batchedUpdate(set, {
        error: 'Failed to save onboarding data',
        loading: false
      });
    }
  },

  loadOnboardingData: async () => {
    batchedUpdate(set, { loading: true, error: null });
    
    try {
      const [storedData, storedComplete] = await Promise.all([
        SecureStore.getItemAsync(ONBOARDING_DATA_KEY),
        SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY)
      ]);

      const onboardingData = storedData ? JSON.parse(storedData) : null;
      const isComplete = storedComplete ? JSON.parse(storedComplete) : false;

      batchedUpdate(set, {
        onboardingData,
        isOnboardingComplete: isComplete,
        loading: false
      });

      return { onboardingData, isComplete };
    } catch (error) {
      batchedUpdate(set, {
        error: 'Failed to load onboarding data',
        loading: false
      });
      return { onboardingData: null, isComplete: false };
    }
  },

  resetOnboarding: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ONBOARDING_DATA_KEY),
        SecureStore.deleteItemAsync(ONBOARDING_COMPLETE_KEY)
      ]);

      batchedUpdate(set, {
        onboardingData: null,
        isOnboardingComplete: false,
        loading: false,
        error: null
      });
    } catch (error) {
      batchedUpdate(set, {
        error: 'Failed to reset onboarding data',
        loading: false
      });
    }
  }
}));

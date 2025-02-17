// frontend/stores/onboardingStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

const ONBOARDING_DATA_KEY = 'onboardingData';
const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';
const NEW_USER_KEY = 'isNewUser';

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

export const useOnboardingStore = create((set, get) => ({
  onboardingData: null,
  isOnboardingComplete: false,
  isNewUser: true,
  loading: false,
  error: null,

  saveOnboardingData: async (data) => {
    set({ loading: true, error: null });

    try {
      const currentData = get().onboardingData || {};
      const updatedData = { ...currentData, ...data };
      const isComplete = checkOnboardingComplete(updatedData);

      await Promise.all([
        SecureStore.setItemAsync(ONBOARDING_DATA_KEY, JSON.stringify(updatedData)),
        SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, JSON.stringify(isComplete))
      ]);

      set({
        onboardingData: updatedData,
        isOnboardingComplete: isComplete,
        loading: false,
        error: null
      });

      return { onboardingData: updatedData, isComplete };
    } catch (error) {
      set({
        error: 'Failed to save onboarding data',
        loading: false
      });
      throw error;
    }
  },

  loadOnboardingData: async () => {
    set({ loading: true, error: null });

    try {
      const [storedData, storedComplete, storedNewUser] = await Promise.all([
        SecureStore.getItemAsync(ONBOARDING_DATA_KEY),
        SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY),
        SecureStore.getItemAsync(NEW_USER_KEY)
      ]);

      const localData = storedData ? JSON.parse(storedData) : null;
      const isComplete = storedComplete ? JSON.parse(storedComplete) : false;
      const isNew = storedNewUser ? JSON.parse(storedNewUser) : true;

      set({
        onboardingData: localData,
        isOnboardingComplete: isComplete,
        isNewUser: isNew,
        loading: false,
        error: null
      });

      return { onboardingData: localData, isComplete };
    } catch (error) {
      set({
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
        SecureStore.deleteItemAsync(ONBOARDING_COMPLETE_KEY),
        SecureStore.deleteItemAsync(NEW_USER_KEY)
      ]);

      set({
        onboardingData: null,
        isOnboardingComplete: false,
        isNewUser: true,
        loading: false,
        error: null
      });
    } catch (error) {
      set({
        error: 'Failed to reset onboarding data',
        loading: false
      });
      throw error;
    }
  },

  markUserAsSeen: async () => {
    try {
      await SecureStore.setItemAsync(NEW_USER_KEY, JSON.stringify(false));
      set({ isNewUser: false });
    } catch (error) {
      console.error('Error marking user as seen:', error);
      set({ error: 'Failed to mark user as seen' });
      throw error;
    }
  },
  completeOnboarding: async () => {
    // Optionally, call an API route that updates onboarding status on the backend.
    // For now, simply mark the onboarding as complete in SecureStore.
    try {
      await SecureStore.setItemAsync('onboardingComplete', JSON.stringify(true));
      // Update local state:
      set({ isOnboardingComplete: true });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  }
}));
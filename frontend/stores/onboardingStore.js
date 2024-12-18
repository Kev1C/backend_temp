// frontend/stores/onboardingStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_DATA_KEY = 'onboardingData';

export const useOnboardingStore = create((set, get) => ({
  onboardingData: null,
  isOnboardingComplete: false,
  loading: false,
  error: null,

  saveOnboardingData: async (data) => {
    set({ loading: true, error: null });
    try {
      const currentData = get().onboardingData || {};
      const updatedData = { ...currentData, ...data };
      
      // Save to secure storage in the background
      SecureStore.setItemAsync(ONBOARDING_DATA_KEY, JSON.stringify(updatedData)).catch(error => {
        console.error('Background save failed:', error);
      });
      
      // Check if all required fields are present
      const isComplete = Boolean(
        updatedData.gender &&
        updatedData.height &&
        updatedData.weight &&
        updatedData.activityLevel &&
        (updatedData.goal || updatedData.fitnessGoal)
      );
      
      // Update state immediately without waiting for storage
      set({ 
        onboardingData: updatedData,
        loading: false,
        isOnboardingComplete: isComplete
      });
      
      return isComplete;
    } catch (error) {
      set({ error: 'Failed to save onboarding data', loading: false });
      throw error;
    }
  },

  completeOnboarding: async () => {
    set({ loading: true, error: null });
    try {
      const currentData = get().onboardingData;
      
      if (!currentData) {
        throw new Error('No onboarding data available');
      }

      // Verify all required fields are present
      const isComplete = Boolean(
        currentData.gender &&
        currentData.height &&
        currentData.weight &&
        currentData.activityLevel &&
        (currentData.goal || currentData.fitnessGoal)
      );

      if (!isComplete) {
        throw new Error('Missing required onboarding data');
      }

      // Mark onboarding as complete
      const updatedData = { 
        ...currentData,
        goal: currentData.goal || currentData.fitnessGoal,
        isComplete: true 
      };
      SecureStore.setItemAsync(ONBOARDING_DATA_KEY, JSON.stringify(updatedData)).catch(error => {
        console.error('Background save failed:', error);
      });
      
      set({ 
        onboardingData: updatedData,
        isOnboardingComplete: true,
        loading: false 
      });

    } catch (error) {
      console.error('Error completing onboarding:', error);
      set({ error: 'Failed to complete onboarding', loading: false });
      throw error;
    }
  },

  loadOnboardingData: async () => {
    set({ loading: true, error: null });
    try {
      const storedData = await SecureStore.getItemAsync(ONBOARDING_DATA_KEY);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        const isComplete = Boolean(
          parsedData.gender &&
          parsedData.height &&
          parsedData.weight &&
          parsedData.activityLevel &&
          (parsedData.goal || parsedData.fitnessGoal) &&
          parsedData.isComplete
        );
        
        set({ 
          onboardingData: parsedData,
          isOnboardingComplete: isComplete,
          loading: false 
        });
      } else {
        set({ onboardingData: null, loading: false });
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      set({ error: 'Failed to load onboarding data', loading: false });
    }
  },

  resetOnboarding: async () => {
    try {
      await SecureStore.deleteItemAsync(ONBOARDING_DATA_KEY);
      set({ 
        onboardingData: null, 
        isOnboardingComplete: false,
        loading: false,
        error: null 
      });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      set({ error: 'Failed to reset onboarding data' });
      throw error;
    }
  }
}));

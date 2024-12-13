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
      
      console.log('Saving onboarding data:', updatedData);
      
      // Save to secure storage
      await SecureStore.setItemAsync(ONBOARDING_DATA_KEY, JSON.stringify(updatedData));
      
      // Check if all required fields are present
      const isComplete = Boolean(
        updatedData.gender &&
        updatedData.height &&
        updatedData.weight &&
        (updatedData.goal || updatedData.fitnessGoal)
      );
      
      console.log('Is data complete?', isComplete, {
        gender: Boolean(updatedData.gender),
        height: Boolean(updatedData.height),
        weight: Boolean(updatedData.weight),
        goal: Boolean(updatedData.goal || updatedData.fitnessGoal)
      });
      
      set({ 
        onboardingData: updatedData,
        loading: false,
        isOnboardingComplete: isComplete
      });
      
      return isComplete;
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      set({ error: 'Failed to save onboarding data', loading: false });
      throw error;
    }
  },

  completeOnboarding: async () => {
    set({ loading: true, error: null });
    try {
      const currentData = get().onboardingData;
      console.log('Completing onboarding with data:', currentData);
      
      if (!currentData) {
        throw new Error('No onboarding data available');
      }

      // Verify all required fields are present
      const isComplete = Boolean(
        currentData.gender &&
        currentData.height &&
        currentData.weight &&
        (currentData.goal || currentData.fitnessGoal)
      );

      console.log('Onboarding data complete check:', {
        hasAllData: isComplete,
        gender: Boolean(currentData.gender),
        height: Boolean(currentData.height),
        weight: Boolean(currentData.weight),
        goal: Boolean(currentData.goal || currentData.fitnessGoal)
      });

      if (!isComplete) {
        throw new Error('Missing required onboarding data');
      }

      // Mark onboarding as complete
      const updatedData = { 
        ...currentData,
        goal: currentData.goal || currentData.fitnessGoal,
        isComplete: true 
      };
      await SecureStore.setItemAsync(ONBOARDING_DATA_KEY, JSON.stringify(updatedData));
      
      set({ 
        onboardingData: updatedData,
        isOnboardingComplete: true,
        loading: false 
      });

      console.log('Onboarding completed successfully:', updatedData);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      set({ error: 'Failed to complete onboarding', loading: false });
      throw error;
    }
  },

  loadOnboardingData: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Loading onboarding data...');
      const storedData = await SecureStore.getItemAsync(ONBOARDING_DATA_KEY);
      console.log('Stored data:', storedData);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('Parsed data:', parsedData);
        
        const isComplete = Boolean(
          parsedData.gender &&
          parsedData.height &&
          parsedData.weight &&
          (parsedData.goal || parsedData.fitnessGoal) &&
          parsedData.isComplete
        );
        
        console.log('Is data complete?', isComplete, {
          gender: Boolean(parsedData.gender),
          height: Boolean(parsedData.height),
          weight: Boolean(parsedData.weight),
          goal: Boolean(parsedData.goal || parsedData.fitnessGoal),
          isComplete: Boolean(parsedData.isComplete)
        });
        
        set({ 
          onboardingData: parsedData,
          isOnboardingComplete: isComplete,
          loading: false 
        });
      } else {
        console.log('No stored onboarding data found');
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

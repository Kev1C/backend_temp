// frontend/stores/onboardingStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import supabase from '../services/supabaseClient';
import { useAuthStore } from './authStore';

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

      // Save to SecureStore
      await Promise.all([
        SecureStore.setItemAsync(ONBOARDING_DATA_KEY, JSON.stringify(updatedData)),
        SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, JSON.stringify(isComplete))
      ]);

      // Save to Supabase if user is authenticated
      const { user, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && user) {
        // Update user metadata with onboarding info
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { 
            onboarding: updatedData,
            onboarding_complete: isComplete
          }
        });
        
        if (metadataError) {
          console.error('Error updating user metadata:', metadataError);
        }
        
        // Optional: Save to a dedicated profiles table if you have one
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            onboarding_data: updatedData,
            onboarding_complete: isComplete,
            updated_at: new Date()
          });
          
        if (profileError) {
          console.error('Error updating user profile:', profileError);
        }
      }

      set({
        onboardingData: updatedData,
        isOnboardingComplete: isComplete,
        loading: false,
        error: null
      });

      return { onboardingData: updatedData, isComplete };
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
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
      let onboardingData = null;
      let isComplete = false;
      let isNew = true;
      
      // Try to get data from Supabase first if user is authenticated
      const { user, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && user) {
        // First check user metadata
        if (user.user_metadata?.onboarding) {
          onboardingData = user.user_metadata.onboarding;
          isComplete = user.user_metadata.onboarding_complete || checkOnboardingComplete(onboardingData);
        } else {
          // Try to fetch from profiles table if metadata doesn't have it
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_data, onboarding_complete')
            .eq('id', user.id)
            .single();
            
          if (!profileError && profileData) {
            onboardingData = profileData.onboarding_data;
            isComplete = profileData.onboarding_complete;
          }
        }
      }
      
      // Fall back to local storage if not available from Supabase
      if (!onboardingData) {
        const [storedData, storedComplete, storedNewUser] = await Promise.all([
          SecureStore.getItemAsync(ONBOARDING_DATA_KEY),
          SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY),
          SecureStore.getItemAsync(NEW_USER_KEY)
        ]);

        onboardingData = storedData ? JSON.parse(storedData) : null;
        isComplete = storedComplete ? JSON.parse(storedComplete) : false;
        isNew = storedNewUser ? JSON.parse(storedNewUser) : true;
      }

      set({
        onboardingData,
        isOnboardingComplete: isComplete,
        isNewUser: isNew,
        loading: false,
        error: null
      });

      return { onboardingData, isComplete };
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      set({
        error: 'Failed to load onboarding data',
        loading: false
      });
      return { onboardingData: null, isComplete: false };
    }
  },

  resetOnboarding: async () => {
    try {
      // Clear local storage
      await Promise.all([
        SecureStore.deleteItemAsync(ONBOARDING_DATA_KEY),
        SecureStore.deleteItemAsync(ONBOARDING_COMPLETE_KEY),
        SecureStore.deleteItemAsync(NEW_USER_KEY)
      ]);
      
      // Clear Supabase data if authenticated
      const { user, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && user) {
        // Reset user metadata
        await supabase.auth.updateUser({
          data: { 
            onboarding: null,
            onboarding_complete: false
          }
        });
        
        // Reset profile data if you have a profiles table
        await supabase
          .from('profiles')
          .update({
            onboarding_data: null,
            onboarding_complete: false,
            updated_at: new Date()
          })
          .eq('id', user.id);
      }

      set({
        onboardingData: null,
        isOnboardingComplete: false,
        isNewUser: true,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to reset onboarding data:', error);
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
      
      // Also save to Supabase if authenticated
      const { user, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && user) {
        await supabase.auth.updateUser({
          data: { 
            is_new_user: false 
          }
        });
      }
      
      set({ isNewUser: false });
    } catch (error) {
      console.error('Error marking user as seen:', error);
      set({ error: 'Failed to mark user as seen' });
      throw error;
    }
  },
  
  completeOnboarding: async () => {
    try {
      // Update local storage
      await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, JSON.stringify(true));
      
      // Update Supabase if authenticated
      const { user, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && user) {
        // Update user metadata
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { 
            onboarding_complete: true 
          }
        });
        
        if (metadataError) {
          console.error('Error updating user metadata:', metadataError);
        }
        
        // Update profile if you have a profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            onboarding_complete: true,
            updated_at: new Date()
          })
          .eq('id', user.id);
          
        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }
      
      // Update local state
      set({ isOnboardingComplete: true });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  }
}));

// frontend/stores/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '../services/supabaseClient';
import { api } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Initialize auth state
      initialize: async () => {
        set({ isLoading: true });
        try {
          // Get the current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session) {
            // Get the user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) throw userError;
            
            set({ 
              user,
              session,
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
          
          // Subscribe to auth state changes
          supabase.auth.onAuthStateChange((event, session) => {
            set({ 
              session, 
              user: session?.user || null,
              isAuthenticated: !!session 
            });
          });
        } catch (error) {
          set({ isLoading: false, error: error.message });
        }
      },
      
      // Sign in with email and password
      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          set({ 
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false 
          });
          
          return data.user;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      // Sign up with email and password
      signUp: async (email, password, metadata = {}) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
            }
          });
          
          if (error) throw error;
          
          set({ 
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.session,
            isLoading: false 
          });
          
          return data.user;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      // Sign in with Google
      signInWithGoogle: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          
          if (error) throw error;
          
          set({ 
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false 
          });
          
          return data.user;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      // Sign in anonymously
      signInAnonymously: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          
          if (error) throw error;
          
          set({ 
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false 
          });
          
          return data.user;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      // Sign out
      signOut: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          set({ 
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      // Update user profile
      updateProfile: async (updates) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.updateUser({
            data: updates
          });
          
          if (error) throw error;
          
          set({ 
            user: data.user,
            isLoading: false 
          });
          
          return data.user;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      // Helper to check if user is a guest
      isGuest: () => {
        const { user } = get();
        // Check if this is an anonymous session
        return user?.aud === 'anonymous' || false;
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

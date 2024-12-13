import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export const useCalorieStore = create(
  persist(
    (set, get) => ({
      calories: 0,
      loading: false,
      error: null,

      addCalories: async (amount) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ loading: true, error: null });

        try {
          const newTotal = get().calories + amount;
          set({ calories: newTotal });

          await api.post('/nutrition/calories', {
            userId: user.id,
            calories: amount,
          });
        } catch (err) {
          set({ error: err.message || 'Failed to add calories' });
          set({ calories: get().calories - amount }); // Revert on error
        } finally {
          set({ loading: false });
        }
      },

      subtractCalories: async (amount) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ loading: true, error: null });

        try {
          const newTotal = Math.max(0, get().calories - amount);
          set({ calories: newTotal });

          await api.post('/nutrition/calories', {
            userId: user.id,
            calories: -amount,
          });
        } catch (err) {
          set({ error: err.message || 'Failed to subtract calories' });
          set({ calories: get().calories + amount }); // Revert on error
        } finally {
          set({ loading: false });
        }
      },

      resetCalories: () => {
        set({ calories: 0 });
      },

      setCalories: (amount) => {
        set({ calories: amount });
      }
    }),
    {
      name: 'calorie-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ calories: state.calories })
    }
  )
);

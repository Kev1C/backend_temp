//frontend/hooks/useMacroTracker.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useMacroStore = create(
  persist(
    (set, get) => ({
      macros: {
        protein: 0,
        carbs: 0,
        fats: 0,
      },
      lastResetDate: null,
      hydrated: false,

      addMacros: (protein, carbs, fats) => {
        if (!get().hydrated) return;
        const currentMacros = get().macros;
        set({
          macros: {
            protein: Math.max(0, currentMacros.protein + Number(protein)),
            carbs: Math.max(0, currentMacros.carbs + Number(carbs)),
            fats: Math.max(0, currentMacros.fats + Number(fats)),
          }
        });
      },

      resetMacros: () => {
        if (!get().hydrated) return;
        const today = new Date().toDateString();
        set({
          macros: { protein: 0, carbs: 0, fats: 0 },
          lastResetDate: today
        });
      },

      checkDailyReset: () => {
        if (!get().hydrated) return;
        const today = new Date().toDateString();
        const lastReset = get().lastResetDate;
        
        if (lastReset !== today) {
          get().resetMacros();
        }
      },

      setMacros: (newMacros) => {
        if (!get().hydrated) return;
        set({ 
          macros: {
            protein: Math.max(0, Number(newMacros.protein || 0)),
            carbs: Math.max(0, Number(newMacros.carbs || 0)),
            fats: Math.max(0, Number(newMacros.fats || 0))
          }
        });
      },

      setHydrated: () => set({ hydrated: true })
    }),
    {
      name: 'macro-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      }
    }
  )
);

export default useMacroStore;

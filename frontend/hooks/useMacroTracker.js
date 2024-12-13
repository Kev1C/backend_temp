import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useMacroStore = create(
  persist(
    (set, get) => ({
      macros: {
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      lastResetDate: null,
      hydrated: false,

      addMacros: (protein, carbs, fat) => {
        if (!get().hydrated) return;
        const currentMacros = get().macros;
        set({
          macros: {
            protein: currentMacros.protein + Number(protein),
            carbs: currentMacros.carbs + Number(carbs),
            fat: currentMacros.fat + Number(fat),
          }
        });
      },

      resetMacros: () => {
        if (!get().hydrated) return;
        const today = new Date().toDateString();
        set({
          macros: { protein: 0, carbs: 0, fat: 0 },
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
        set({ macros: newMacros });
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

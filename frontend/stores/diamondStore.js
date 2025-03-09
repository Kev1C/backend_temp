// frontend/stores/diamondStore.js
import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './authStore';

export const useDiamondStore = create((set, get) => ({
  balance: 0,
  loading: false,
  error: null,

  fetchBalance: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getDiamondBalance();
      console.log('Fetched balance response:', response.data);
      set({ balance: response.data.balance, loading: false });
    } catch (error) {
      console.error('Error fetching balance:', error);
      set({ error: error.message, loading: false });
    }
  },

  addDiamonds: async (amount) => {
    set({ loading: true, error: null });
    try {
      const response = await api.addDiamonds(amount);
      console.log('Add diamonds response:', response.data);
      if (response.data.newBalance !== undefined) {
        set({ balance: response.data.newBalance, loading: false });
      } else {
        console.error('Invalid response format - missing newBalance:', response.data);
        throw new Error('Server response format error');
      }
    } catch (error) {
      console.error('Error adding diamonds:', error);
      set({ error: error.message, loading: false });
    }
  },

  deductDiamonds: async (amount) => {
    set({ loading: true, error: null });
    try {
      const response = await api.deductDiamonds(amount);
      console.log('Deduct diamonds response:', response.data);
      if (response.data.newBalance !== undefined) {
        set({ balance: response.data.newBalance, loading: false });
      } else {
        console.error('Invalid response format - missing newBalance:', response.data);
        throw new Error('Server response format error');
      }
    } catch (error) {
      console.error('Error deducting diamonds:', error);
      set({ error: error.message, loading: false });
    }
  },
}));

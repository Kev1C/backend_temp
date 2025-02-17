// frontend/stores/diamondStore.js
import { create } from 'zustand';
import { api } from '../services/api';
//import { getState } from './authStore';  // Remove this - we don't need getState directly.
import { useAuthStore } from './authStore'; // Keep the useAuthStore import


export const useDiamondStore = create((set, get) => ({
  balance: 0,
  loading: false,
  error: null,

  fetchBalance: async () => {
    set({ loading: true, error: null });
    try {
      // Correct way to access methods and state from another store:
      const authState = useAuthStore.getState(); // Get the state from useAuthStore
      await authState.ensureValidToken();        // Call the method on the state

      const response = await api.get('/diamonds/balance', {
        headers: { Authorization: `Bearer ${authState.authToken}` }, // Access authToken
      });
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
            const authState = useAuthStore.getState(); // Get auth state
            await authState.ensureValidToken(); // Call method

            const response = await api.post('/diamonds/add', { amount }, {
                headers: { Authorization: `Bearer ${authState.authToken}` }, // Use authState
            });
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
      const authState = useAuthStore.getState(); // Get auth state
      await authState.ensureValidToken(); // Call method

      const response = await api.post('/diamonds/deduct', { amount }, {
        headers: { Authorization: `Bearer ${authState.authToken}` }, // Use authState
      });
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
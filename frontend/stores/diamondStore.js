// frontend/stores/diamondStore.js
import { create } from 'zustand';
import { api } from '../services/api';

export const useDiamondStore = create((set) => ({
    balance: 0,
    loading: false,
    error: null,

    fetchBalance: async (token) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/diamonds/balance', {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Fetched balance response:', response.data);
            set({ balance: response.data.balance, loading: false });
        } catch (error) {
            console.error('Error fetching balance:', error);
            set({ error: error.message, loading: false });
        }
    },

    addDiamonds: async (amount, token) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/diamonds/add', { amount }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Add diamonds response:', response.data);
            if (response.data.newBalance !== undefined) {
                set({ balance: response.data.newBalance, loading: false });
            } else {
                console.error('Invalid response format - missing newBalance:', response.data);
                // Fetch the balance as a fallback
                const balanceResponse = await api.get('/diamonds/balance', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                set({ balance: balanceResponse.data.balance, loading: false });
            }
        } catch (error) {
            console.error('Error adding diamonds:', error);
            set({ error: error.message, loading: false });
        }
    },

    deductDiamonds: async (amount, token) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/diamonds/deduct', { amount }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Deduct diamonds response:', response.data);
            if (response.data.newBalance !== undefined) {
                set({ balance: response.data.newBalance, loading: false });
            } else {
                console.error('Invalid response format - missing newBalance:', response.data);
                // Fetch the balance as a fallback
                const balanceResponse = await api.get('/diamonds/balance', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                set({ balance: balanceResponse.data.balance, loading: false });
            }
        } catch (error) {
            console.error('Error deducting diamonds:', error);
            set({ error: error.message, loading: false });
        }
    },
}));
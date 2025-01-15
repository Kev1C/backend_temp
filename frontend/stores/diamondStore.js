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
            const response = await api.get('/diamonds/balance', { // Updated path
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ balance: response.data.balance, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addDiamonds: async (amount, token) => { // Updated function name
        set({ loading: true, error: null });
        try {
            const response = await api.post('/diamonds/add', { amount }, { // Updated path
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ balance: response.data.newBalance, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    deductDiamonds: async (amount, token) => { // Updated function name
        set({ loading: true, error: null });
        try {
            const response = await api.post('/diamonds/deduct', { amount }, { // Updated path
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ balance: response.data.newBalance, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));
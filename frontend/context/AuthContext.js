// frontend/context/AuthContext.js

// This file is deprecated and will be removed.
// All authentication state management has been moved to stores/authStore.js
// Please use useAuthStore() instead of AuthContext

import React from 'react';
import { useAuthStore } from '../stores/authStore';

// Keep this temporarily for backward compatibility
export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  const authStore = useAuthStore();
  
  return (
    <AuthContext.Provider value={authStore}>
      {children}
    </AuthContext.Provider>
  );
};

// TODO: Remove this file once all components have been migrated to use useAuthStore

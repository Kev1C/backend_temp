// frontend/context/ThemeContext.js

import React, { createContext } from 'react';
import merge from 'deepmerge';
import { DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

// Design tokens for consistent styling
const designTokens = {
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    full: 9999,
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Merge Paper and Navigation themes
const CombinedDefaultTheme = merge(PaperDefaultTheme, NavigationDefaultTheme);

// Customize theme with fitness app specific colors
const CustomizedDefaultTheme = {
  ...CombinedDefaultTheme,
  ...designTokens,
  dark: false,
  colors: {
    ...CombinedDefaultTheme.colors,
    // Primary colors
    primary: '#2196F3',
    primaryLight: '#64B5F6',
    primaryDark: '#1976D2',
    
    // Secondary colors
    secondary: '#FF4081',
    secondaryLight: '#FF80AB',
    secondaryDark: '#F50057',
    
    // UI colors
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    
    // Status colors
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
    
    // Fitness specific colors
    workout: '#FF6B6B',
    nutrition: '#4ECDC4',
    progress: '#45B7D1',
    rest: '#95A5A6',
  },
  
  // Shadows for elevation
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 5,
    },
  },
};

export const ThemeContext = createContext({
  theme: CustomizedDefaultTheme,
});

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme: CustomizedDefaultTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
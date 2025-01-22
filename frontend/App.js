// App.js

import 'react-native-gesture-handler'; // Must be at the very top
import React, { useEffect } from 'react';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper'; 
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from './stores/authStore';
import { useOnboardingStore } from './stores/onboardingStore';
import AppNavigator from './navigation/AppNavigator';

// Preload heavy components
const preloadComponents = () => {
  const promises = [
    import('./Components/MacroNutrientsChart'),
    import('./Components/NutritionHeatmap')
  ];
  return Promise.all(promises);
};

const App = () => {
  const { initializeAuth } = useAuthStore();
  const { loadOnboardingData } = useOnboardingStore();

  useEffect(() => {
    const initializeApp = async () => {
      await Promise.all([
        initializeAuth(),
        loadOnboardingData(),
        preloadComponents()
      ]);
    };

    initializeApp();
  }, []);

  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme }) => {
          if (!theme) {
            console.error('ThemeContext: theme is undefined');
            return null;
          }
          return (
            <PaperProvider theme={theme}>
              <StatusBar style={theme.dark ? 'light' : 'dark'} />
              <NavigationContainer theme={theme}>
                <AppNavigator />
              </NavigationContainer>
            </PaperProvider>
          );
        }}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
};

export default App;
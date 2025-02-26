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
import { cachedGet } from './services/api';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const preloadApiData = async (authToken) => {
  if (!authToken) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const promises = [
      cachedGet('/meals/recent', { params: { date: today } })
    ];
    await Promise.all(promises);
  } catch (error) {
    console.warn('Error preloading data:', error);
  }
};

const preloadComponents = () => {
  const promises = [
    import('./Components/MacroNutrientsChart'),
    import('./Components/NutritionHeatmap')
  ];
  return Promise.all(promises);
};

const App = () => {
  const { initializeAuth, authToken } = useAuthStore();
  const { loadOnboardingData } = useOnboardingStore();

  useEffect(() => {
    const initializeApp = async () => {
      await Promise.all([
        initializeAuth(),
        loadOnboardingData()
      ]);
      await Promise.all([
        preloadComponents(),
        preloadApiData(authToken)
      ]);
    };
    initializeApp();
  }, [authToken]);

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
};

export default App;

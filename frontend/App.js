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
import mobileAds from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const App = () => {
  const { initializeAuth } = useAuthStore();
  const { loadOnboardingData } = useOnboardingStore();

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize mobile ads
      await mobileAds().initialize({
        requestConfig: {
          // Initialize with your app IDs
          applicationId: Platform.select({
            android: 'ca-app-pub-2191904332416469~4553503462',
            ios: 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy',
          }),
        },
      });

      await Promise.all([
        initializeAuth(),
        loadOnboardingData()
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
// App.js

import 'react-native-gesture-handler'; // Must be at the very top
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper'; 
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  return (
    <AuthProvider>
      <OnboardingProvider>
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
      </OnboardingProvider>
    </AuthProvider>
  );
};

export default App;
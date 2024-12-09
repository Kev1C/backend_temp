import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GenderSelectionScreen from '../screens/Onboarding/GenderSelectionScreen';
import HeightWeightScreen from '../screens/Onboarding/HeightWeightScreen';
import GoalSelectionScreen from '../screens/Onboarding/GoalSelectionScreen';
import SocialAuthScreen from '../screens/Onboarding/SocialAuthScreen';

const Stack = createNativeStackNavigator();

const OnboardingNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: false // Prevent back gesture during onboarding
    }}
    initialRouteName="GenderSelection"
  >
    <Stack.Screen
      name="GenderSelection"
      component={GenderSelectionScreen}
    />
    <Stack.Screen
      name="HeightWeight"
      component={HeightWeightScreen}
    />
    <Stack.Screen
      name="GoalSelection"
      component={GoalSelectionScreen}
    />
    <Stack.Screen
      name="SocialAuth"
      component={SocialAuthScreen}
      options={{
        gestureEnabled: false
      }}
    />
  </Stack.Navigator>
);

export default OnboardingNavigator;

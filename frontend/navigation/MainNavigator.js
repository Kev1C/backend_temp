import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import ExercisesScreen from '../screens/Home/ExercisesScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';
import BodyAnalysisScreen from '../screens/Home/BodyAnalysisScreen';
import ResourcesScreen from '../screens/Home/ResourcesScreen';
import CommunityScreen from '../screens/Home/CommunityScreen';
import AvatarScreen from '../screens/Profile/AvatarScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CameraScreen from '../screens/Camera/CameraScreen';
import WorkoutHeatmapScreen from '../screens/Profile/WorkoutHeatmapScreen';
import { defaultScreenOptions } from './screenOptions';

const Stack = createStackNavigator();

const MainNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      ...defaultScreenOptions,
      headerShown: false
    }}
  >
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="Exercises" component={ExercisesScreen} />
    <Stack.Screen name="Progress" component={ProgressScreen} />
    <Stack.Screen name="BodyAnalysis" component={BodyAnalysisScreen} />
    <Stack.Screen name="Resources" component={ResourcesScreen} />
    <Stack.Screen name="Community" component={CommunityScreen} />
    <Stack.Screen name="Avatar" component={AvatarScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Camera" component={CameraScreen} />
    <Stack.Screen name="WorkoutHeatmap" component={WorkoutHeatmapScreen} />
  </Stack.Navigator>
);

export default MainNavigator;

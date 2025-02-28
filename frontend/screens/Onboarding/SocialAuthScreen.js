//frontend/screens/Onboarding/SocialAuthScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './SocialAuthScreen.styles';
import sharedStyles from './SharedOnboardingLayout.styles';
import OnboardingProgress from '../../Components/OnboardingProgress';
import { auth, signInAsGuest } from '../../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from '@firebase/auth';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';

WebBrowser.maybeCompleteAuthSession();

export default function SocialAuthScreen({ navigation }) {
  const { onboardingData, isOnboardingComplete, completeOnboarding } = useOnboardingStore();
  const { signInAnonymously } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const insets = useSafeAreaInsets();

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    scopes: ['profile', 'email']
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await googlePromptAsync();

      if (result?.type === 'success') {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);

        // Get backend JWT using Firebase token
        await signInAnonymously(userCredential);
        
        // Navigate immediately to show UI faster
        navigation.replace('Tabs');
        
        // Load onboarding data in background after navigation
        useOnboardingStore.getState().loadOnboardingData().then(({onboardingData}) => {
          const hasAllData = onboardingData?.gender &&
                         onboardingData?.height &&
                         onboardingData?.weight &&
                         (onboardingData?.goal || onboardingData?.fitnessGoal);
                         
          if (!hasAllData) {
            // If onboarding data is incomplete, start from the beginning
            useOnboardingStore.getState().resetOnboarding();
            navigation.replace('GenderSelection');
          } else {
            useOnboardingStore.getState().completeOnboarding();
          }
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google. Please try again.');
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simplified login flow - authenticate first
      await signInAnonymously();
      
      // Navigate immediately to home screen
      navigation.replace('Tabs');
      
      // Process onboarding data in background after navigation
      useOnboardingStore.getState().loadOnboardingData().then(({onboardingData}) => {
        const hasRequiredData = Boolean(
          onboardingData?.gender &&
          onboardingData?.height &&
          onboardingData?.weight &&
          (onboardingData?.goal || onboardingData?.fitnessGoal)
        );
        
        if (!hasRequiredData) {
          useOnboardingStore.getState().resetOnboarding();
          navigation.replace('GenderSelection');
        } else {
          useOnboardingStore.getState().completeOnboarding();
        }
      });
    } catch (error) {
      console.error('Guest sign in error:', error);
      setError('Failed to sign in as guest. Please try again.');
      Alert.alert('Error', 'Failed to sign in as guest. Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <OnboardingProgress currentScreen="SocialAuth" />
      <View style={sharedStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={sharedStyles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={sharedStyles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.socialButton,
              styles.googleButton,
              loading && styles.disabledButton
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <AntDesign name="google" size={24} color="#DB4437" style={styles.socialIcon} />
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              styles.guestButton,
              loading && styles.disabledButton
            ]}
            onPress={handleGuestSignIn}
            disabled={loading}
          >
            <AntDesign name="user" size={24} color="#666666" style={styles.socialIcon} />
            <Text style={styles.buttonText}>
              {loading ? 'Creating guest account...' : 'Continue as Guest'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.termsText, { paddingBottom: insets.bottom }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

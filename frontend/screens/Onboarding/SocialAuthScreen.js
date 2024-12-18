import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        
        // Check if all required onboarding data is present
        const hasAllData = onboardingData?.gender && 
                         onboardingData?.height && 
                         onboardingData?.weight && 
                         (onboardingData?.goal || onboardingData?.fitnessGoal);
        
        if (hasAllData && !isOnboardingComplete) {
          await completeOnboarding();
          navigation.replace('Tabs');
        } else {
          // If onboarding data is incomplete, start from the beginning
          navigation.replace('GenderSelection');
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google. Please try again.');
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load the latest onboarding data
      await useOnboardingStore.getState().loadOnboardingData();
      
      // Get the fresh data after loading
      const { onboardingData, isOnboardingComplete } = useOnboardingStore.getState();
      
      console.log('Current onboarding data:', onboardingData);
      console.log('Is onboarding complete?', isOnboardingComplete);
      
      // Sign in as guest using Firebase
      await signInAnonymously();
      
      // Check if all required onboarding data is present
      const hasAllData = Boolean(
        onboardingData?.gender &&
        onboardingData?.height &&
        onboardingData?.weight &&
        (onboardingData?.goal || onboardingData?.fitnessGoal)
      );
      
      console.log('Has all required data?', hasAllData);
      console.log('Required fields:', {
        gender: Boolean(onboardingData?.gender),
        height: Boolean(onboardingData?.height),
        weight: Boolean(onboardingData?.weight),
        goal: Boolean(onboardingData?.goal || onboardingData?.fitnessGoal)
      });
      
      if (hasAllData && !isOnboardingComplete) {
        console.log('Attempting to complete onboarding...');
        await completeOnboarding();
        console.log('Onboarding completed, navigating to Tabs');
        navigation.replace('Tabs');
      } else if (!hasAllData) {
        console.log('Missing onboarding data, redirecting to GenderSelection');
        // Reset onboarding data before starting over
        await useOnboardingStore.getState().resetOnboarding();
        navigation.replace('GenderSelection');
      } else {
        console.log('Onboarding already complete, navigating to Tabs');
        navigation.replace('Tabs');
      }
    } catch (error) {
      console.error('Guest sign in error:', error);
      setError('Failed to sign in as guest. Please try again.');
      Alert.alert('Error', 'Failed to sign in as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={sharedStyles.container}>
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

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

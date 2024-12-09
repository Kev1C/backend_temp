import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AntDesign } from '@expo/vector-icons';
import { styles } from './SocialAuthScreen.styles';
import { OnboardingContext } from '../../context/OnboardingContext';
import { AuthContext } from '../../context/AuthContext';
import { auth, signInAsGuest } from '../../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from '@firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function SocialAuthScreen({ navigation }) {
  const { completeOnboarding, onboardingData } = useContext(OnboardingContext);
  const { signInAnonymously } = useContext(AuthContext);
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
        
        // Complete onboarding if necessary
        if (onboardingData) {
          await completeOnboarding();
        }
        
        navigation.replace('Home');
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
      
      // Sign in as guest using Firebase
      const userCredential = await signInAsGuest();
      await signInAnonymously();
      
      // Complete onboarding if necessary
      if (onboardingData) {
        await completeOnboarding();
      }
      
      navigation.replace('Home');
    } catch (error) {
      console.error('Guest sign in error:', error);
      setError('Failed to sign in as guest. Please try again.');
      Alert.alert('Error', 'Failed to sign in as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateOnboardingData = () => {
    const { gender, height, weight, fitnessGoal } = onboardingData;
    if (!gender || !height || !weight || !fitnessGoal) {
      return false;
    }
    return true;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
  );
}

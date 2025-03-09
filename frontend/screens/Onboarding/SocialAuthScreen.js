//frontend/screens/Onboarding/SocialAuthScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import googleLogo from '../../assets/images/google.png';
import appleLogo from '../../assets/images/apple.png';
import facebookLogo from '../../assets/images/facebook.png';
import logo from '../../assets/images/app-logo.png';
import supabase from '../../services/supabaseClient';
import Constants from 'expo-constants';

// Register for redirect
WebBrowser.maybeCompleteAuthSession();

const SocialAuthScreen = ({ navigation }) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const { signInAnonymously } = useAuthStore();
  const { isAuthenticated, user } = useAuthStore();

  // Setup redirectUrl for OAuth
  const redirectUrl = makeRedirectUri({
    scheme: Constants.expoConfig?.scheme || 'myapp',
    path: 'auth/callback',
  });

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated && user) {
      navigation.replace('MainTabs');
    }
  }, [isAuthenticated, user, navigation]);

  // Setup deep linking handler for when auth redirects back to the app
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('auth/callback')) {
        handleDeepLink(url);
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  // Handle the deep link after social auth
  const handleDeepLink = async (url) => {
    try {
      setIsLoading(true);
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      
      if (error) throw error;
      
      // Navigate immediately to show UI faster
      navigation.replace('MainTabs');
      
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
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Authentication Error', error.message);
    } finally {
      setIsLoading(false);
      setProvider(null);
    }
  };

  const handleSocialSignIn = async (providerName) => {
    try {
      setIsLoading(true);
      setProvider(providerName);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: providerName,
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      if (error) throw error;
      
      // The OAuth flow continues in the browser, and then redirects back
      // to the app, which is handled by the deep link handler
    } catch (error) {
      console.error(`${providerName} sign in error:`, error);
      Alert.alert('Authentication Error', error.message);
      setIsLoading(false);
      setProvider(null);
    }
  };

  const handleGoogleSignIn = () => handleSocialSignIn('google');
  const handleAppleSignIn = () => handleSocialSignIn('apple');
  const handleFacebookSignIn = () => handleSocialSignIn('facebook');

  const handleGuestSignIn = async () => {
    try {
      setIsLoading(true);
      setProvider('guest');
      
      await signInAnonymously();
      
      // Navigate immediately to home screen
      navigation.replace('MainTabs');
      
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
      Alert.alert('Authentication Error', 'Failed to sign in as guest. Please try again.');
    } finally {
      setIsLoading(false);
      setProvider(null);
    }
  };

  const handleViewTerms = () => {
    WebBrowser.openBrowserAsync('https://yourapp.com/terms');
  };

  const handleViewPrivacy = () => {
    WebBrowser.openBrowserAsync('https://yourapp.com/privacy');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20, fontSize: 16 }}>
          {provider === 'google' && "Connecting to Google..."}
          {provider === 'apple' && "Connecting to Apple..."}
          {provider === 'facebook' && "Connecting to Facebook..."}
          {provider === 'guest' && "Creating guest account..."}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.appTitle}>NutriTrack</Text>
        <Text style={styles.subtitle}>Track your nutrition and reach your goals</Text>
      </View>

      <View style={styles.authContainer}>
        <TouchableOpacity 
          style={[styles.socialButton, styles.googleButton]}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
        >
          <Image source={googleLogo} style={styles.socialIcon} />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity 
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            activeOpacity={0.8}
          >
            <Image source={appleLogo} style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.socialButton, styles.facebookButton]}
          onPress={handleFacebookSignIn}
          activeOpacity={0.8}
        >
          <Image source={facebookLogo} style={styles.socialIcon} />
          <Text style={[styles.socialButtonText, { color: '#fff' }]}>Continue with Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.socialButton, styles.guestButton]}
          onPress={handleGuestSignIn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-outline" size={24} color="#333" />
          <Text style={[styles.socialButtonText, styles.guestButtonText]}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink} onPress={handleViewTerms}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink} onPress={handleViewPrivacy}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  authContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  facebookButton: {
    backgroundColor: '#3b5998',
  },
  guestButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  guestButtonText: {
    color: '#555',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  termsLink: {
    color: '#3498db',
    fontWeight: '500',
  },
});

export default SocialAuthScreen;

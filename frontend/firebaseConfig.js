//frontend/firebaseConfig.js
import { initializeApp } from '@firebase/app';
import { getReactNativePersistence, initializeAuth, signInAnonymously } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnbFbM-eV526jvyeI3AcKOAriq1do9_Qc",
  authDomain: "fitness-app-bf54e.firebaseapp.com",
  projectId: "fitness-app-bf54e",
  storageBucket: "fitness-app-bf54e.firebasestorage.app",
  messagingSenderId: "700221597688",
  appId: "1:700221597688:web:4b7789dc0288bca9bed80d",
  measurementId: "G-DVXQ60VXCT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Connect to Firebase emulators in development
if (__DEV__) {
  const { connectAuthEmulator } = require("@firebase/auth");
  // Connect to the auth emulator using Android emulator special localhost IP
  connectAuthEmulator(auth, "http://10.0.2.2:9099");
}

// Helper functions
export const signInAsGuest = async () => {
  try {
    console.log('Attempting anonymous sign-in...'); // Debug log
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    if (!user) {
      throw new Error('User object is undefined');
    }

    const token = await user.getIdToken(true);
    console.log('Anonymous sign-in successful, user:', user.uid);

    // Return a consistent object structure
    return {
      user,
      token,
      type: 'guest',
      id: user.uid,
      email: user.email || null, // Handle potential null email
      provider: 'guest'
    };
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
};

export const getFirebaseToken = async (user = null) => {
  try {
    if (user) {
      return await user.getIdToken(true);
    } else {
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken(true);
      }
      return null;
    }
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    throw error;
  }
};

export { auth };
export default app;

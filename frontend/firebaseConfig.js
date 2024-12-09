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

// Helper functions
export const getFirebaseToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken(true);
    }
    return null;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    throw error;
  }
};

export const signInAsGuest = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
};

export { auth };
export default app;

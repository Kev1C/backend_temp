// frontend/app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://10.0.0.203:5000',
  },
  // Enable New Architecture
  experiments: {
    tsconfigPaths: true,
  },
  // Explicitly enable new architecture
  newArchEnabled: true,
  // Configure Google Mobile Ads
  plugins: [
    [
      "react-native-google-mobile-ads",
      {
        android_app_id: process.env.GOOGLE_ADMOB_ANDROID_APP_ID,
        ios_app_id: process.env.GOOGLE_ADMOB_IOS_APP_ID,
        // Optional: Configure test devices
        testDeviceIdentifiers: ["EMULATOR"],
      }
    ]
  ]
});
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
        android_app_id: "ca-app-pub-2191904332416469~4553503462",
        ios_app_id: "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy", // Replace with your iOS app ID
        // Optional: Configure test devices
        testDeviceIdentifiers: ["EMULATOR"],
      }
    ]
  ]
});
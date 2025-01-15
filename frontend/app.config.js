// frontend/app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://10.0.0.203:5000', // Use development machine's IP address or default
  },
  plugins: [
    "react-native-google-mobile-ads",
  ],
});
// frontend/app.config.js

export default ({ config }) => ({
  ...config, 
  extra: {
    apiBaseUrl: 'http://10.0.0.203:5000', // Your development machine's IP address
  },
  'react-native-google-mobile-ads': {
    android_app_id: 'ca-app-pub-2191904332416469~4553503462',
    ios_app_id: 'ca-app-pub-xxxxxxxx~xxxxxxxx',
  },
  plugins: [
    "react-native-google-mobile-ads" 
  ],
});
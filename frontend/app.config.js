import 'dotenv/config';

export default ({ config }) => ({
  ...config, 
  extra: {
    apiBaseUrl: 'http://127.0.0.1:5001/fitness-app-bf54e/us-central1/api', // Your development machine's IP address
  },
  plugins: [
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: "ca-app-pub-2191904332416469~4553503462",
        iosAppId: "ca-app-pub-2191904332416469~1234567890"
      }
    ]
  ],
});
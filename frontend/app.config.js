import 'dotenv/config';

export default ({ config }) => ({
  ...config, 
  extra: {
    apiBaseUrl: 'http://10.0.0.203:5000', // Your development machine's IP address
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
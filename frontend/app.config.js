// frontend/app.config.js

export default ({ config }) => ({
  ...config,
  extra: {
    apiBaseUrl: 'http://10.0.0.203:5000', // Use development machine's IP address
  },
});
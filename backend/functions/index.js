const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const app = require("./app"); // Import your Express app

let isInitialized = false;

// Initialize Firebase Admin with emulator-specific configuration
const initialize = () => {
  if (!isInitialized && !admin.apps.length) {
    if (process.env.FUNCTIONS_EMULATOR || process.env.USE_FIREBASE_EMULATOR) {
      admin.initializeApp({
        projectId: "fitness-app-bf54e", // Match the frontend project ID
      });
    } else {
      admin.initializeApp();
    }
    isInitialized = true;
  }
};

// Initialize once when the module loads
initialize();

// Export your Express app as a Cloud Function named 'api' using v2 syntax
exports.api = onRequest(
    {
      timeoutSeconds: 540,
      memory: "1GB",
    },
    app,
);

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("./app"); // Import your express app.

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

// Export your Express app as a Cloud Function named 'api'
exports.api = functions.https.onRequest((req, res) => {
  // Remove /api prefix if it appears twice
  if (req.url.startsWith("/api/api")) {
    req.url = req.url.replace("/api/api", "/api");
  }
  return app(req, res);
});

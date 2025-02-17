const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("../app"); // Import your express app.

// Initialize Firebase Admin with emulator-specific configuration
if (!admin.apps.length) {
  if (process.env.FUNCTIONS_EMULATOR) {
    admin.initializeApp({
      projectId: "fitness-app-bf54e", // Match the frontend project ID
    });
  } else {
    admin.initializeApp();
  }
}

// Export your Express app as a Cloud Function named 'api'
exports.api = functions.https.onRequest((req, res) => {
  // Remove /api prefix if it appears twice
  if (req.url.startsWith("/api/api")) {
    req.url = req.url.replace("/api/api", "/api");
  }
  return app(req, res);
});

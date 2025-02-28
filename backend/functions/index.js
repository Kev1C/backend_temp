//backend/functions/index.js
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp();
  console.log("Firebase Admin initialized in index.js");
}
const app = require("./app");
// Export your Express app as a Cloud Function named 'api' using v2 syntax
exports.api = onRequest(
    {
      timeoutSeconds: 540,
      memory: "1GB",
      region: "us-central1", // Explicitly specify a region
    },
    app,
);

console.log("Firebase function 'api' exported successfully");

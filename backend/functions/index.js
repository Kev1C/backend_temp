//backend/functions/index.js
const functions = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
  console.log("Firebase Admin initialized in index.js");
}
const app = require("./app");
exports.api = onRequest(
    {
      timeoutSeconds: 540,
      memory: "1GB",
      region: "us-central1",
      minInstances: 0,
    },
    app,
);

console.log("Firebase function 'api' exported successfully");

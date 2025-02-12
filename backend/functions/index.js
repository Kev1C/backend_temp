/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require('firebase-admin');
const app = require('../app'); // Import your express app.

// Initialize Firebase Admin (if not already done in app.js)
if (!admin.apps.length) {
    admin.initializeApp();
}

// Export your Express app as a Cloud Function named 'api'
exports.api = functions.https.onRequest(app);
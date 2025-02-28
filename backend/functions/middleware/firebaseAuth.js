const admin = require("firebase-admin");

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
  // Check if service account exists before parsing
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", error);
      // Fall back to default initialization if parsing fails
      admin.initializeApp();
    }
  } else {
    // If no service account is provided, use default initialization
    // This will work with emulators or when using application default credentials
    admin.initializeApp();
  }
}

const firebaseAuth = async (req, res, next) => {
  const firebaseToken = req.header("Firebase-Token");

  if (!firebaseToken) {
    return res.status(401).json({message: "No Firebase token provided"});
  }

  try {
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    // Attach the decoded token to the request
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    res.status(401).json({message: "Invalid Firebase token"});
  }
};

module.exports = firebaseAuth;

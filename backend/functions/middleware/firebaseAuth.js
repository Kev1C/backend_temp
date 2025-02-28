//backend/functions/middleware/firebaseAuth.js
const admin = require("firebase-admin");

// No initialization here - rely on the initialization in index.js

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
    
    console.log("Firebase authentication successful for user:", decodedToken.uid);
    next();
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    res.status(401).json({message: "Invalid Firebase token"});
  }
};

module.exports = firebaseAuth;

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const firebaseAuth = async (req, res, next) => {
    const firebaseToken = req.header('Firebase-Token');

    if (!firebaseToken) {
        return res.status(401).json({ message: 'No Firebase token provided' });
    }

    try {
        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

        // Attach the decoded token to the request
        req.user = decodedToken;

        next();
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        res.status(401).json({ message: 'Invalid Firebase token' });
    }
};

module.exports = firebaseAuth;
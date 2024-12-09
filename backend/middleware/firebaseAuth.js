const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
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
        
        // Create or update user in your database
        // This should be moved to a user service in production
        const user = {
            firebaseUid: decodedToken.uid,
            email: decodedToken.email,
            // Add any other user properties you want to store
        };

        // Generate your backend JWT
        const backendToken = jwt.sign(
            { userId: decodedToken.uid },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Attach the user and token to the request
        req.user = user;
        req.backendToken = backendToken;
        
        next();
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        res.status(401).json({ message: 'Invalid Firebase token' });
    }
};

module.exports = firebaseAuth;

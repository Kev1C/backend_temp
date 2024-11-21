// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    console.log('=== DEBUG: Auth Middleware ===');
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);

    if (!authHeader) {
        console.log('No auth header found');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Remove "Bearer " prefix from the token
        const token = authHeader.replace('Bearer ', '');
        console.log('Processing token:', token.substring(0, 20) + '...');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', {
            userId: decoded.userId,
            id: decoded.id,
            exp: decoded.exp
        });
        
        req.user = { 
            userId: decoded.userId || decoded.id,
            id: decoded.userId || decoded.id // Include both for backward compatibility
        };
        console.log('User object set:', req.user);
        
        next();
    } catch(err) {
        console.error('Token verification error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
}

module.exports = auth;

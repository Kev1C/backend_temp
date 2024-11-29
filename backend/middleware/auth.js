// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Remove "Bearer " prefix from the token
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Use userId if available, otherwise fallback to id
        const userIdToUse = decoded.userId || decoded.id;
        
        req.user = { 
            userId: userIdToUse,
            id: userIdToUse
        };
        
        next();
    } catch(err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
}

module.exports = auth;

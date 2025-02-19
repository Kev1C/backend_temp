// middleware/auth.js
const jwt = require('jsonwebtoken');

// Token verification cache (TTL: 5 minutes)
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Remove "Bearer " prefix from the token
        const token = authHeader.replace('Bearer ', '');
        
    // Check cache first
    const cachedUser = tokenCache.get(token);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdToUse = decoded.userId;

    const user = {
      userId: userIdToUse,
      id: userIdToUse,
    };

    // Cache the user data
    tokenCache.set(token, user);
    setTimeout(() => tokenCache.delete(token), CACHE_TTL);

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;

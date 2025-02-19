// middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) return res.status(401).json({ message: 'User not found' });
        if (user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
}

module.exports = adminAuth;
// backend/middleware/adminAuth.js
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user.userId;
    
    // Get user from database
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Server error in admin auth middleware' });
  }
};

module.exports = adminAuth;

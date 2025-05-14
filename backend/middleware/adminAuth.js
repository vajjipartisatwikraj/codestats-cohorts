const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Check if req.user exists and has a userType of 'admin'
    if (!req.user || req.user.userType !== 'admin') {
      console.log(`Admin access denied for user: ${req.user?.id}, userType: ${req.user?.userType}`);
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    console.log(`Admin access granted for user: ${req.user.id}`);
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 
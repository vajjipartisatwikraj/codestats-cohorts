const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  // Check for Bearer token in Authorization header
  const authHeader = req.header('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Fallback to x-auth-token header
    token = req.header('x-auth-token');
  }

  if (!token) {
    return res.status(401).json({ 
      message: 'No token, authorization denied',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set basic user information from token
    req.user = {
      id: decoded.userId
    };
    
    // Get the full user information from database including userType
    const user = await User.findById(decoded.userId).select('userType');
    if (user) {
      req.user.userType = user.userType;
      console.log(`User authenticated: ${decoded.userId}, Type: ${req.user.userType}`);
    } else {
      console.log(`User not found for ID: ${decoded.userId}`);
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ 
      message: 'Token is not valid',
      code: 'TOKEN_INVALID'
    });
  }
};

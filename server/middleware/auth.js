const { verifyIdToken } = require('../utils/googleAuth');
const User = require('../models/User');

/**
 * Middleware to verify Google ID token and attach user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    
    // Get or create user
    let user = await User.findOne({ firebaseUID: decodedToken.uid });
    
    if (!user) {
      user = await User.create({
        firebaseUID: decodedToken.uid,
        email: decodedToken.email,
        balance: 1000,
        isAdmin: false,
      });
    } else {
      // Update email if changed
      if (user.email !== decodedToken.email) {
        user.email = decodedToken.email;
        await user.save();
      }
    }
    
    req.user = user;
    req.googleToken = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: error.message || 'Authentication failed' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await verifyIdToken(idToken);
      
      const user = await User.findOne({ firebaseUID: decodedToken.uid });
      if (user) {
        req.user = user;
        req.googleToken = decodedToken;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};

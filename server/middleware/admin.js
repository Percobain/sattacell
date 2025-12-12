/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

/**
 * Middleware to verify admin password for admin panel access
 */
function verifyAdminPassword(req, res, next) {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }
  
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }
  
  next();
}

module.exports = {
  requireAdmin,
  verifyAdminPassword,
};


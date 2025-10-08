const jwt = require('jsonwebtoken');

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware to verify JWT tokens
 * Checks if the request has a valid JWT token in the Authorization header
 * Adds the decoded user information to req.user if token is valid
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header (format: "Bearer TOKEN")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If no token is provided, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Attach user information to request object for use in route handlers
    req.user = user;
    next();
  });
};

/**
 * Generate a JWT token for a user
 * Token expires in 24 hours by default
 *
 * @param {Object} user - User object with id, username, and email
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  authenticateToken,
  generateToken,
  JWT_SECRET
};

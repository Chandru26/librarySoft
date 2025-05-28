const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to protect routes by verifying JWT.
 * Extracts user information from the token and attaches it to req.user.
 */
const protect = (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach decoded user information to the request object
      // This typically includes userId, organizationId, organizationSchema, role, etc.
      // as defined in the JWT payload during login.
      req.user = decoded;

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification failed:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, token failed (invalid signature or malformed).' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired.' });
      }
      // For other errors during verification
      return res.status(401).json({ message: 'Not authorized, token verification failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};

/**
 * Higher-order function to create role-based authorization middleware.
 * Example Usage: router.get('/admin-only', protect, authorize(['admin']), (req, res) => { ... });
 * @param {Array<string>} allowedRoles - Array of roles that are allowed to access the route.
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // This should ideally not happen if 'protect' middleware runs first
      return res.status(403).json({ message: 'Forbidden: User role not available.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next(); // User has one of the allowed roles
  };
};

module.exports = { protect, authorize };

/*
Usage Example:

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('./middleware/authMiddleware'); // Adjust path as needed

// Protected route, accessible by any authenticated user
router.get('/profile', protect, (req, res) => {
  // req.user is available here
  res.json({
    message: 'This is a protected profile route.',
    user: req.user
  });
});

// Protected route, accessible only by authenticated users with the 'admin' role
router.get('/admin-dashboard', protect, authorize(['admin']), (req, res) => {
  // req.user is available here, and user role is 'admin'
  res.json({
    message: 'Welcome to the admin dashboard.',
    user: req.user
  });
});

// Protected route, accessible by 'librarian' or 'admin'
router.post('/books', protect, authorize(['librarian', 'admin']), (req, res) => {
  // Logic to add a new book
  res.json({ message: 'Book added successfully (mock).', user: req.user });
});

*/

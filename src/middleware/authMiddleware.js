// src/middleware/authMiddleware.js

export const requireLogin = (req, res, next) => {
  if (req.session && req.session.userId) {
    // If a session exists and has a userId, proceed to the next function
    return next();
  } else {
    // If not, redirect to the login page
    return res.redirect('/auth/login');
  }
};
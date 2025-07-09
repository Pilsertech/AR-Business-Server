import { Router } from 'express';
import passport from '../config/passport.js';

const router = Router();

// Show login page
router.get('/login', (req, res) => {
  // Use flash for error, fallback to null if not set
  const error = req.flash ? req.flash('error') : [];
  res.render('login', { error: error[0] || null });
});

// Process login form using Passport
router.post('/login',
  (req, res, next) => {
    // If already logged in, redirect to dashboard
    if (req.user) {
      if (req.user.isMainAdmin) return res.redirect('/dashboard/admins');
      return res.redirect('/dashboard');
    }
    next();
  },
  passport.authenticate('local', {
    failureRedirect: '/auth/login',
    failureFlash: true
  }),
  (req, res) => {
    // Role-based redirect after successful login
    if (req.user && req.user.isMainAdmin) {
      res.redirect('/dashboard/admins');
    } else {
      res.redirect('/dashboard');
    }
  }
);

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/auth/login');
    });
  });
});

export default router;
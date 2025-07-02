// src/routes/authRoutes.js

import { Router } from 'express';
import AdminUser from '../models/AdminUser.js';

const router = Router();

// Show login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Process login form
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await AdminUser.findOne({ where: { email } });

  if (!user || !(await user.isValidPassword(password))) {
    return res.status(401).render('login', { error: 'Invalid email or password.' });
  }

  req.session.userId = user.id;
  res.redirect('/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

export default router;
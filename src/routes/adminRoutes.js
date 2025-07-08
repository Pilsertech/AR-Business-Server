// src/routes/adminRoutes.js

import { Router } from 'express';
import AdminUser from '../models/AdminUser.js';
import { requireLogin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireLogin);

// GET /admins - Admin management page
router.get('/', async (req, res) => {
  const admins = await AdminUser.findAll({ attributes: ['id', 'email', 'locked'] });
  // Always pass success and error for EJS view
  const success = req.flash ? req.flash('success') : [];
  const error = req.flash ? req.flash('error') : [];
  res.render('admins', { admins, currentUserId: req.session.userId, success, error });
});

// GET new admin form
router.get('/new', (req, res) => {
  const success = req.flash ? req.flash('success') : [];
  const error = req.flash ? req.flash('error') : [];
  res.render('new-admin', { success, error });
});

// POST /admins/change-password/:id - Change an admin's password
router.post('/change-password/:id', async (req, res) => {
  const { newPassword } = req.body;
  const admin = await AdminUser.findByPk(req.params.id);
  if (!admin || admin.locked) {
    req.flash('error', 'Cannot update this admin.');
    return res.redirect('/admins');
  }
  admin.password = newPassword; // Will be hashed by model hook
  await admin.save();
  req.flash('success', 'Password updated.');
  res.redirect('/admins');
});

// POST /admins/lock/:id - Lock an admin (prevent login)
router.post('/lock/:id', async (req, res) => {
  if (parseInt(req.params.id, 10) === req.session.userId) {
    req.flash('error', 'You cannot lock your own account.');
    return res.redirect('/admins');
  }
  const admin = await AdminUser.findByPk(req.params.id);
  if (!admin) {
    req.flash('error', 'Admin not found.');
    return res.redirect('/admins');
  }
  admin.locked = true;
  await admin.save();
  req.flash('success', `Locked admin: ${admin.email}`);
  res.redirect('/admins');
});

// POST /admins/unlock/:id - Unlock an admin (allow login)
router.post('/unlock/:id', async (req, res) => {
  const admin = await AdminUser.findByPk(req.params.id);
  if (!admin) {
    req.flash('error', 'Admin not found.');
    return res.redirect('/admins');
  }
  admin.locked = false;
  await admin.save();
  req.flash('success', `Unlocked admin: ${admin.email}`);
  res.redirect('/admins');
});

// POST new admin
router.post('/new', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await AdminUser.findOne({ where: { email } });
    if (existing) {
      req.flash('error', 'Admin with this email already exists.');
      return res.redirect('/admins/new');
    }
    await AdminUser.create({ email, password });
    req.flash('success', 'New admin created.');
    res.redirect('/admins');
  } catch (err) {
    req.flash('error', 'Error creating admin.');
    res.redirect('/admins/new');
  }
});

// Delete an admin
router.post('/delete/:id', async (req, res) => {
  if (parseInt(req.params.id, 10) === req.session.userId) {
    req.flash('error', 'You cannot delete your own account.');
    return res.redirect('/admins');
  }
  await AdminUser.destroy({ where: { id: req.params.id } });
  req.flash('success', 'Admin deleted.');
  res.redirect('/admins');
});

export default router;
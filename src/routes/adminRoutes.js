// src/routes/adminRoutes.js

import { Router } from 'express';
import AdminUser from '../models/AdminUser.js';
import { requireLogin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireLogin);

// GET /admins - Admin management page
router.get('/', async (req, res) => {
  const admins = await AdminUser.findAll({ attributes: ['id', 'email', 'locked'] });
  res.render('admins', { admins, currentUserId: req.session.userId });
});

// GET new admin form
router.get('/new', (req, res) => {
  res.render('new-admin');
});

// POST /admins/change-password/:id - Change an admin's password
router.post('/change-password/:id', async (req, res) => {
  const { newPassword } = req.body;
  const admin = await AdminUser.findByPk(req.params.id);
  if (!admin || admin.locked) return res.status(400).send('Cannot update this admin.');
  admin.password = newPassword; // Will be hashed by model hook
  await admin.save();
  res.redirect('/admins');
});

// POST /admins/lock/:id - Lock an admin (prevent login)
router.post('/lock/:id', async (req, res) => {
  const admin = await AdminUser.findByPk(req.params.id);
  if (!admin) return res.status(400).send('Admin not found.');
  admin.locked = true;
  await admin.save();
  res.redirect('/admins');
});


// POST /admins/lock/:id - Lock an admin (prevent login)
router.post('/lock/:id', async (req, res) => {
  // Prevent locking yourself
  if (parseInt(req.params.id, 10) === req.session.userId) {
    // Optionally, you could flash a message here instead of sending plain text!
    return res.status(403).send('You cannot lock your own account.');
  }
  const admin = await AdminUser.findByPk(req.params.id);
  if (!admin) return res.status(400).send('Admin not found.');
  admin.locked = true;
  await admin.save();
  res.redirect('/admins');
});

// POST /admins/unlocks/:id - unlock an admin (allow login )

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
import { Router } from 'express';
import AdminUser from '../models/AdminUser.js';
import { requireLogin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireLogin);

// Middleware to restrict certain actions to main admin (if desired)
function requireMainAdmin(req, res, next) {
  if (req.user && req.user.isMainAdmin) return next();
  return res.status(403).send('Forbidden');
}

// GET /admins - Admin management page (main admin only)
router.get('/', requireMainAdmin, async (req, res) => {
  const admins = await AdminUser.findAll({ attributes: ['id', 'email', 'locked', 'isMainAdmin'] });
  const success = req.flash ? req.flash('success') : [];
  const error = req.flash ? req.flash('error') : [];
  res.render('admins', { admins, currentUserId: req.session.userId, success, error });
});

// GET new admin form (main admin only)
router.get('/new', requireMainAdmin, (req, res) => {
  const success = req.flash ? req.flash('success') : [];
  const error = req.flash ? req.flash('error') : [];
  res.render('new-admin', { success, error });
});

// POST /admins/change-password/:id - Change an admin's password (main admin only)
router.post('/change-password/:id', requireMainAdmin, async (req, res) => {
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

// POST /admins/lock/:id - Lock an admin (main admin only, prevent locking self or another main admin)
router.post('/lock/:id', requireMainAdmin, async (req, res) => {
  if (parseInt(req.params.id, 10) === req.session.userId) {
    req.flash('error', 'You cannot lock your own account.');
    return res.redirect('/admins');
  }
  const admin = await AdminUser.findByPk(req.params.id);
  if (!admin || admin.isMainAdmin) {
    req.flash('error', 'Admin not found or is main admin.');
    return res.redirect('/admins');
  }
  admin.locked = true;
  await admin.save();
  req.flash('success', `Locked admin: ${admin.email}`);
  res.redirect('/admins');
});

// POST /admins/unlock/:id - Unlock an admin (main admin only)
router.post('/unlock/:id', requireMainAdmin, async (req, res) => {
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

// POST new admin (main admin only)
router.post('/new', requireMainAdmin, async (req, res) => {
  const { email, password, password2 } = req.body;

  if (!password || !password2) {
    req.flash('error', 'Both password fields are required.');
    return res.redirect('/admins/new');
  }
  if (password !== password2) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/admins/new');
  }

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
    console.error(err);
    req.flash('error', 'Error creating admin.');
    res.redirect('/admins/new');
  }
});

// Delete an admin (main admin only, prevent deleting self or another main admin)
router.post('/delete/:id', requireMainAdmin, async (req, res) => {
  if (parseInt(req.params.id, 10) === req.session.userId) {
    req.flash('error', 'You cannot delete your own account.');
    return res.redirect('/admins');
  }
  const admin = await AdminUser.findByPk(req.params.id);
  if (!admin || admin.isMainAdmin) {
    req.flash('error', 'Admin not found or is main admin.');
    return res.redirect('/admins');
  }
  await admin.destroy();
  req.flash('success', 'Admin deleted.');
  res.redirect('/admins');
});

export default router;
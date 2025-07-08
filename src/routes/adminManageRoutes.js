import { Router } from 'express';
import AdminUser from '../models/AdminUser.js';
import bcrypt from 'bcrypt';

// Middleware: Only main admin
function requireMainAdmin(req, res, next) {
  if (req.user && req.user.isMainAdmin) return next();
  return res.status(403).send('Forbidden');
}

const router = Router();
router.use(requireMainAdmin);

// List all admins
router.get('/', async (req, res) => {
  try {
    const admins = await AdminUser.findAll({ order: [['id', 'ASC']] });
    res.render('manage-admins', {
      admins,
      success: res.locals.success || [],
      error: res.locals.error || []
    });
  } catch (err) {
    res.render('manage-admins', { admins: [], success: [], error: ['Failed to load admins.'] });
  }
});

// Add new admin
router.post('/add', async (req, res) => {
  try {
    const { fullName, email, phone, country, city, username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await AdminUser.create({
      fullName, email, phone, country, city, username,
      password: hashed,
      isApproved: true,
      isMainAdmin: false,
      locked: false
    });
    req.flash('success', 'Admin added!');
    res.redirect('/dashboard/admins');
  } catch (e) {
    req.flash('error', 'Could not add admin (maybe email/username exists)');
    res.redirect('/dashboard/admins');
  }
});

// Lock/unlock admin
router.post('/:id/lock', async (req, res) => {
  try {
    const admin = await AdminUser.findByPk(req.params.id);
    if (!admin || admin.isMainAdmin) throw new Error('Cannot lock main admin');
    admin.locked = !admin.locked;
    await admin.save();
    req.flash('success', `Admin ${admin.locked ? 'locked' : 'unlocked'}.`);
    res.redirect('/dashboard/admins');
  } catch (e) {
    req.flash('error', 'Failed to update admin status.');
    res.redirect('/dashboard/admins');
  }
});

// Delete admin
router.post('/:id/delete', async (req, res) => {
  try {
    const admin = await AdminUser.findByPk(req.params.id);
    if (!admin || admin.isMainAdmin) throw new Error('Cannot delete main admin');
    await admin.destroy();
    req.flash('success', 'Admin deleted.');
    res.redirect('/dashboard/admins');
  } catch (e) {
    req.flash('error', 'Failed to delete admin.');
    res.redirect('/dashboard/admins');
  }
});

export default router;
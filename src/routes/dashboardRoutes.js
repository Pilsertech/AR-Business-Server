//  src/routes/dashboardRoutes.js
//  All routes behind /dashboard/*  (protected by requireLogin)
import { Router } from 'express';
import { upload } from '../config/multerConfig.js';
import {
  getAllContents,
  getBySlug,
  createContent,
  deleteContentBySlug,
  updateContentBySlug
} from '../viewModels/arContentVM.js';
import { requireLogin } from '../middleware/authMiddleware.js';
import AdminUser from '../models/AdminUser.js';

const router = Router();
router.use(requireLogin);

/* ─── Dashboard list ─────────────────────────────────────────────────────── */
// Enhanced: show main admin dashboard or user-only dashboard based on role

router.get('/', async (req, res, next) => {
  try {
    // Check if this is the main admin (change logic as needed for your system)
    // Here, we use isMainAdmin boolean, but you may use role, or check by email, etc.
    // You should ensure req.user is populated by your auth middleware
    const user = req.user;
    let contents = [];
    let viewName = 'dashboard';

    // You may have another way to check for main admin. Adjust as needed!
    if (user && user.isMainAdmin) {
      // Main admin sees everything
      contents = await getAllContents();
      viewName = 'dashboard'; // main admin dashboard
    } else {
      // Regular admin sees only their own content
      contents = await getAllContents({ adminUserId: user.id });
      viewName = 'dashboard-user'; // user dashboard
    }

    // Flash messages or fallback to query params
    const success = res.locals.success || (req.query.success ? [req.query.success] : []);
    const error = res.locals.error || (req.query.error ? [req.query.error] : []);

    res.render(viewName, { contents, success, error });
  } catch (err) { next(err); }
});

/* ─── Add new content ────────────────────────────────────────────────────── */
router.get('/new', (_req, res) => res.render('new-content'));

router.post(
  '/new',
  upload.fields([{ name: 'assetFile', maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const b = req.body;
      await createContent(
        {
          ...b,
          adminUserId: req.user.id,
          actionButton: b.actionButtonText && b.actionButtonUrl
            ? { text: b.actionButtonText, url: b.actionButtonUrl }
            : null
        },
        req.files
      );
      res.redirect('/dashboard?success=Content added successfully!');
    } catch (err) {
      res.redirect('/dashboard?error=Failed to add content.');
    }
  }
);

/* ─── Edit content – show form ───────────────────────────────────────────── */
router.get('/edit/:slug', async (req, res, next) => {
  try {
    const content = await getBySlug(req.params.slug);
    if (!content) return res.status(404).send('Content not found');
    // Only main admin or the content owner can edit
    if (!req.user.isMainAdmin && content.adminUserId !== req.user.id) {
      return res.status(403).send('Forbidden');
    }
    res.render('edit-content', { content });
  } catch (err) { next(err); }
});

/* ─── Edit content – handle submit ───────────────────────────────────────── */
router.post(
  '/edit/:slug',
  upload.fields([
    { name: 'markerFiles', maxCount: 1 } // one .mind file
  ]),
  async (req, res, next) => {
    try {
      const content = await getBySlug(req.params.slug);
      // Only main admin or the content owner can update
      if (!req.user.isMainAdmin && content.adminUserId !== req.user.id) {
        return res.status(403).send('Forbidden');
      }
      await updateContentBySlug(req.params.slug, req.body, req.files);
      res.redirect('/dashboard?success=Content updated!');
    } catch (err) {
      res.redirect('/dashboard?error=Failed to update content.');
    }
  }
);

/* ─── Delete content ─────────────────────────────────────────────────────── */
router.post('/delete/:slug', async (req, res, next) => {
  try {
    const content = await getBySlug(req.params.slug);
    // Only main admin or the content owner can delete
    if (!req.user.isMainAdmin && content.adminUserId !== req.user.id) {
      return res.status(403).send('Forbidden');
    }
    await deleteContentBySlug(req.params.slug);
    res.redirect('/dashboard?success=Content deleted.');
  } catch (err) {
    res.redirect('/dashboard?error=Failed to delete content.');
  }
});

/* ─── Manage account (password/username) ─────────────────────────────────── */
router.get('/manage-account', (req, res) => {
  // user = req.user (populated from session/auth)
  res.render('manage-account', { user: req.user, success: res.locals.success || [], error: res.locals.error || [] });
});

router.post('/manage-account', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  try {
    const user = await AdminUser.findByPk(req.user.id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/dashboard/manage-account');
    }
    // You must have a method to check passwords!
    if (!(await user.verifyPassword(currentPassword))) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/dashboard/manage-account');
    }
    user.username = username;
    if (newPassword && newPassword.length > 0) {
      user.password = await user.hashPassword(newPassword); // You MUST hash passwords!
    }
    await user.save();
    req.flash('success', 'Account updated.');
    res.redirect('/dashboard/manage-account');
  } catch (err) {
    req.flash('error', 'Failed to update account.');
    res.redirect('/dashboard/manage-account');
  }
});

export default router;
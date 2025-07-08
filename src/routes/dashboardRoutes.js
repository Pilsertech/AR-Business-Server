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

const router = Router();
router.use(requireLogin);

/* ─── Dashboard list ─────────────────────────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const contents = await getAllContents();

    // Ensure success and error are always defined (for flash or manual messages)
    // If you use connect-flash, uncomment below and ensure flash middleware is loaded in your app.js/server.js
    // const success = req.flash ? req.flash('success') : [];
    // const error = req.flash ? req.flash('error') : [];

    // If you don't use flash, you can use query params or session or just default empty arrays
    const success = req.query.success ? [req.query.success] : [];
    const error = req.query.error ? [req.query.error] : [];

    res.render('dashboard', { contents, success, error });
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
          actionButton: b.actionButtonText && b.actionButtonUrl
            ? { text: b.actionButtonText, url: b.actionButtonUrl }
            : null
        },
        req.files
      );
      // Optionally add a success message as a query param
      res.redirect('/dashboard?success=Content added successfully!');
    } catch (err) {
      // Optionally redirect with error
      res.redirect('/dashboard?error=Failed to add content.');
    }
  }
);

/* ─── Edit content – show form ───────────────────────────────────────────── */
router.get('/edit/:slug', async (req, res, next) => {
  try {
    const content = await getBySlug(req.params.slug);
    if (!content) return res.status(404).send('Content not found');
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
    await deleteContentBySlug(req.params.slug);
    res.redirect('/dashboard?success=Content deleted.');
  } catch (err) {
    res.redirect('/dashboard?error=Failed to delete content.');
  }
});

export default router;
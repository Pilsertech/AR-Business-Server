// ────────────────────────────────────────────────────────────────────────────
//  src/routes/dashboardRoutes.js
//  All routes behind /dashboard/*  (protected by requireLogin)
// ────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { upload } from '../config/multerConfig.js';
import {
  getAllContents,
  getBySlug,
  createContent,
  deleteContentBySlug,
  updateContentBySlug            // NEW import
} from '../viewModels/arContentVM.js';
import { requireLogin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireLogin);

/* ─── Dashboard list ─────────────────────────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const contents = await getAllContents();
    res.render('dashboard', { contents });
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
      res.redirect('/dashboard');
    } catch (err) { next(err); }
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
      res.redirect('/dashboard');
    } catch (err) { next(err); }
  }
);

/* ─── Delete content ─────────────────────────────────────────────────────── */
router.post('/delete/:slug', async (req, res, next) => {
  try {
    await deleteContentBySlug(req.params.slug);
    res.redirect('/dashboard');
  } catch (err) { next(err); }
});

export default router;

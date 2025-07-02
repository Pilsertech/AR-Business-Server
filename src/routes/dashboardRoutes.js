import { Router } from 'express';
import { upload } from '../config/multerConfig.js';
import {
  getAllContents,
  getBySlug,
  createContent,
  deleteContentBySlug,
  attachMarkerFiles,
} from '../viewModels/arContentVM.js';
import { requireLogin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireLogin);

/* ─── Dashboard list ──────────────────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const contents = await getAllContents();
    res.render('dashboard', { contents });
  } catch (err) { next(err); }
});

/* ─── Add new content ─────────────────────────────────────────────── */
router.get('/new', (req, res) => res.render('new-content'));

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
            : null,
        },
        req.files
      );
      res.redirect('/dashboard');
    } catch (err) { next(err); }
  }
);

/* ─── Edit content (GET) ──────────────────────────────────────────── */
router.get('/edit/:slug', async (req, res, next) => {
  try {
    const content = await getBySlug(req.params.slug);
    if (!content) return res.status(404).send('Not found');
    res.render('edit-content', { content });
  } catch (err) { next(err); }
});

/* ─── Edit content (POST) – update scene + optional marker replace ── */
router.post(
  '/edit/:slug',
  upload.fields([
    { name: 'fsetFile',  maxCount: 1 },
    { name: 'fset3File', maxCount: 1 },
    { name: 'isetFile',  maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const slug = req.params.slug;
      const b    = req.body;

      /* 1. update simple fields */
      await attachMarkerFiles(slug, req.files);      // no‑op if no files
      const content = await getBySlug(slug);
      content.positionX   = b.positionX;
      content.positionY   = b.positionY;
      content.positionZ   = b.positionZ;
      content.modelScale  = b.modelScale;
      content.actionButton= (b.actionButtonText && b.actionButtonUrl)
        ? { text: b.actionButtonText, url: b.actionButtonUrl }
        : null;
      await content.save();

      res.redirect('/dashboard');
    } catch (err) { next(err); }
  }
);

/* ─── Delete content ──────────────────────────────────────────────── */
router.post('/delete/:slug', async (req, res, next) => {
  try {
    await deleteContentBySlug(req.params.slug);
    res.redirect('/dashboard');
  } catch (err) { next(err); }
});

export default router;

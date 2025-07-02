// src/routes/arContentRoutes.js

import { Router } from 'express';
// Import our shared multer configuration for handling file uploads
import { upload } from '../config/multerConfig.js';
// Import the CORRECT ViewModel functions
import { createContent, getBySlug } from '../viewModels/arContentVM.js';

const router = Router();

/* ==================================================================
 * API: POST /api/content
 * Handles content creation from an API call (e.g., from a mobile app or script).
 * This route is now much "thinner" because the ViewModel does all the work.
 * ================================================================== */
router.post(
  '/api/content', // The endpoint for API-based uploads
  // Use the shared multer config to handle file fields
  upload.fields([
    { name: 'assetFile', maxCount: 1 },
    { name: 'targetFile', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      // All the complex logic is now inside createContent!
      // We just pass it the form data (req.body) and file data (req.files).
      const newContent = await createContent(req.body, req.files);

      // Respond with the details of the newly created content.
      res.status(201).json({
        message: 'Content created successfully',
        slug: newContent.slug,
        qrCodeUrl: newContent.qrCodeUrl,
      });
    } catch (err) {
      // Pass any errors to the global error handler in app.js
      next(err);
    }
  }
);

/* ==================================================================
 * PAGE: GET /card/:slug
 * Renders the public-facing AR experience page.
 * This part of your file was already well-structured.
 * ================================================================== */
router.get('/card/:slug', async (req, res, next) => {
  try {
    const content = await getBySlug(req.params.slug);

    if (!content) {
      // If no content is found for the slug, send a 404 error.
      return res.status(404).send('Content not found.');
    }

    // Render the 'card.ejs' view and pass the content data to it.
    res.render('card', { content });
  } catch (err) {
    next(err);
  }
});

export default router;
// src/routes/arContentRoutes.js (Updated for multiple templates)

import { Router } from 'express';
import { getBySlug } from '../viewModels/arContentVM.js';

const router = Router();

/* * PAGE: GET /card/:slug
 * This route now dynamically determines which template to render.
 */
router.get('/card/:slug', async (req, res, next) => {
  try {
    const content = await getBySlug(req.params.slug);
    if (!content) {
      return res.status(404).send('Content not found.');
    }

    // NEW LOGIC: Determine the template path from the experienceType
    // Example: 'marker-model' becomes 'marker/model'
    const viewPath = content.experienceType.replace('-', '/');

    // Render the dynamically chosen template file (e.g., 'marker/model.ejs')
    res.render(viewPath, { content });

  } catch (err) {
    // If the template file doesn't exist (e.g., 'face/video'), it will throw an error.
    // We catch it and send a more helpful message.
    if (err.message.includes('Failed to lookup view')) {
      console.error(`Error: Template not found for experience type "${content.experienceType}" at path "${err.view?.name}"`);
      return res.status(404).send(`The AR experience type "${content.experienceType}" is not supported.`);
    }
    // Pass other errors to the global handler
    next(err);
  }
});

// The POST /api/content route can be removed from this file as it is now handled by the dashboard.
// Or kept for other uses if needed.

export default router;

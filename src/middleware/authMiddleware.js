import AdminUser from '../models/AdminUser.js';

/**
 * Middleware to ensure a user is logged in and populate req.user.
 * If Passport.js is used, req.user is set by passport.session().
 * If not, this will hydrate req.user using session userId.
 */
export async function requireLogin(req, res, next) {
  // If using Passport and req.user exists, just continue
  if (req.user) return next();

  // Fallback: Check session-based login
  if (!req.session.userId) {
    // Handle AJAX/XHR/API requests
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/auth/login');
  }
  try {
    // Always refresh user from DB to ensure latest data (isMainAdmin, locked, etc.)
    const user = await AdminUser.findByPk(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      // Handle AJAX/XHR/API requests
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      return res.redirect('/auth/login');
    }
    req.user = user;
    next();
  } catch (err) {
    // Optional: log error for debugging
    console.error('AuthMiddleware error:', err);
    req.session.destroy(() => {});
    // Handle AJAX/XHR/API requests
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    res.redirect('/auth/login');
  }
}

/**
 * Middleware to restrict route to only main admin users.
 * Usage: router.use(requireMainAdmin) or as middleware on routes.
 */
export function requireMainAdmin(req, res, next) {
  if (req.user && req.user.isMainAdmin) return next();
  // Handle AJAX/XHR/API requests
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({ error: 'Forbidden: Main admin only' });
  }
  return res.status(403).send('Forbidden');
}
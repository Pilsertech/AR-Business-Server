import AdminUser from '../models/AdminUser.js';

// Middleware to ensure login and attach req.user
export async function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    // Only fetch and attach user if not already present
    if (!req.user) {
      const user = await AdminUser.findByPk(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.redirect('/auth/login');
      }
      req.user = user;
    }
    next();
  } catch (err) {
    // Optional: log error
    req.session.destroy(() => {});
    res.redirect('/auth/login');
  }
}
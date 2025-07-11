import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { renderWebedit } from '../utils/webeditRender.js';
import elfinderNode from 'elfinder-node'; // CommonJS default import

// Import your AdminUser model for authentication
import AdminUser from '../models/AdminUser.js';

// Secure admin-only middleware (same logic as in app.js)
async function ensureAdminAuthenticated(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    req.flash?.('error', 'Please log in as an approved admin.');
    return res.redirect('/webedit/login');
  }
  try {
    const user = await AdminUser.findByPk(req.user.id);
    if (
      user &&
      (
        user.username === 'admin' ||
        user.isMainAdmin === true ||
        user.canWebEdit === true ||
        user.isAuthorised === true ||
        (user.isApproved === true && user.locked === false)
      )
    ) {
      req.user = user;
      return next();
    }
    req.flash?.('error', 'You are not authorized to access this page.');
    return res.redirect('/webedit/login');
  } catch (e) {
    console.error(e);
    req.flash?.('error', 'Authentication failed.');
    return res.redirect('/webedit/login');
  }
}

const router = Router();

/* ────── Render dashboard page with elFinder embedded ────── */
router.get('/', ensureAdminAuthenticated, (req, res) => {
  renderWebedit(res, 'editor-dashboard', {
    user: req.user
  });
});

/* ────── AUDIT LOG ────── */
router.get('/audit', ensureAdminAuthenticated, async (req, res) => {
  try {
    const logPath = path.resolve('audit/file_audit.log');
    let logs = [];
    try {
      const raw = await fs.readFile(logPath, 'utf-8');
      logs = raw.trim().split('\n').map(JSON.parse).reverse();
    } catch {}
    renderWebedit(res, 'audit-log', { logs });
  } catch (e) {
    res.status(500).send('Audit log unavailable');
  }
});

/* ────── elFinder Node.js Connector ────── */
router.all('/webedit/connector',ensureAdminAuthenticated, elfinderNode([
  {
    driver: 'LocalFileSystem',
    path: path.resolve(process.cwd(), 'storage/files'),
    URL: '/files/'
  }
]));

/* ────── UTIL: AUDIT LOGGER ────── */
async function logAudit(user, action, file, oldContent, newContent) {
  const logPath = path.resolve('audit/file_audit.log');
  const entry = {
    time: new Date().toISOString(),
    who: user.username,
    action,
    file,
    oldContent: (typeof oldContent === 'string' && oldContent.length < 5000) ? oldContent : undefined,
    newContent: (typeof newContent === 'string' && newContent.length < 5000) ? newContent : undefined,
    id: require('crypto').randomUUID?.() || require('uuid').v4()
  };
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, JSON.stringify(entry) + '\n');
}

export default router;
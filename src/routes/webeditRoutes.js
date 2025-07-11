import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { renderWebedit } from '../utils/webeditRender.js';

// elFinder Node.js connector (install with: npm install @sosukesuzuki/elfinder-node-express)
import elFinder from '@sosukesuzuki/elfinder-node-express';

// File root directories (edit as needed)
const SAFE_ROOTS = [
  { alias: 'Views', path: path.resolve('src/views') },
  { alias: 'Public', path: path.resolve('public') }
];

// Check if the file/folder path is within allowed roots
function isSafePath(filepath) {
  const full = path.resolve(filepath);
  return SAFE_ROOTS.some(root => full.startsWith(root.path));
}

// Multer for media uploads
const upload = multer({ dest: 'tmp_uploads/' });

/**
 * Middleware: Allow main admin OR trusted users (canWebEdit)
 */
function requireWebEditAccess(req, res, next) {
  if (req.user && (req.user.isMainAdmin || req.user.canWebEdit)) return next();
  return res.status(403).send('Forbidden');
}

/**
 * (Optional) Restrict trusted users to only certain subfolders
 * Here we allow trusted users only in public/upload and its subfolders
 * Main admin has full access. Adjust logic as needed.
 */
function isFolderAllowed(folder, user) {
  if (user.isMainAdmin) return true;
  if (user.canWebEdit) {
    const allowedRoot = path.resolve('public/upload');
    return path.resolve(folder).startsWith(allowedRoot);
  }
  return false;
}

const router = Router();

/* ────── Serve elFinder static client assets ────── */
router.use('/elfinder', requireWebEditAccess, (req, res, next) => {
  // Serve elFinder client (should be at public/vendor/elfinder)
  // (Mount this route after express.static for public)
  express.static(path.resolve('public/vendor/elfinder'))(req, res, next);
});

/* ────── elFinder backend connector ────── */
router.all('/elfinder/connector', requireWebEditAccess, elFinder({
  roots: SAFE_ROOTS.map(root => ({
    driver: elFinder.LocalFileSystem,
    path: root.path,
    alias: root.alias,
    // Optionally: add uploadAllow, uploadDeny, uploadOrder, accessControl, etc.
    // See elFinder docs for more config options
  })),
}));

/* ────── Render dashboard page with elFinder embedded ────── */
router.get('/', requireWebEditAccess, async (req, res) => {
  // Render a page that loads elFinder in a div
  renderWebedit(res, 'editor-dashboard-elfinder', {
    user: req.user
  });
});

/* ────── (Optional) Legacy AJAX/file/folder endpoints, if you want to keep EJS-based editor as fallback ────── */
// ...keep your previous AJAX endpoints, file/folder create/delete, audit, etc...

/* ────── AUDIT LOG ────── */
router.get('/audit', requireWebEditAccess, async (req, res) => {
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
    id: uuidv4()
  };
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, JSON.stringify(entry) + '\n');
}

export default router;
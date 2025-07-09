import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { renderWebedit } from '../utils/webeditRender.js'; // Helper for webedit EJS rendering

// File root directories (edit as needed)
const SAFE_ROOTS = [
  path.resolve('src/views'),
  path.resolve('public')
];

// Check if the file/folder path is within allowed roots
function isSafePath(filepath) {
  const full = path.resolve(filepath);
  return SAFE_ROOTS.some(root => full.startsWith(root));
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

/* ───────────── LIST FILES ───────────── */
router.get('/', requireWebEditAccess, async (req, res) => {
  const folder = req.query.folder || SAFE_ROOTS[0];
  const absFolder = path.resolve(folder);
  if (!isSafePath(absFolder) || !isFolderAllowed(absFolder, req.user))
    return res.status(403).send('Forbidden (folder access)');
  try {
    const files = await fs.readdir(absFolder, { withFileTypes: true });
    renderWebedit(res, 'editor-dashboard', {
      folder: absFolder,
      files,
      SAFE_ROOTS
    });
  } catch (e) {
    res.status(500).send('Cannot read folder');
  }
});

/* ───────────── VIEW FILE ───────────── */
router.get('/view', requireWebEditAccess, async (req, res) => {
  const file = req.query.file;
  if (!file || !isSafePath(file) || !isFolderAllowed(path.dirname(file), req.user))
    return res.status(403).send('Forbidden (file access)');
  try {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) return res.redirect(`/webedit?folder=${file}`);
    const ext = path.extname(file).toLowerCase();
    let content = '';
    let isBinary = false;
    if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.mp4', '.webm'].includes(ext)) {
      isBinary = true;
    } else {
      content = await fs.readFile(file, 'utf-8');
    }
    renderWebedit(res, 'file-viewer', {
      file, content, isBinary, ext
    });
  } catch (e) {
    res.status(500).send('Cannot open file');
  }
});

/* ───────────── EDIT FILE (GET) ───────────── */
router.get('/edit', requireWebEditAccess, async (req, res) => {
  const file = req.query.file;
  if (!file || !isSafePath(file) || !isFolderAllowed(path.dirname(file), req.user))
    return res.status(403).send('Forbidden (file access)');
  try {
    const content = await fs.readFile(file, 'utf-8');
    renderWebedit(res, 'file-viewer', {
      file, content, isBinary: false, editing: true
    });
  } catch (e) {
    res.status(500).send('Cannot open file');
  }
});

/* ───────────── UPDATE FILE (POST) ───────────── */
router.post('/save', requireWebEditAccess, async (req, res) => {
  const { file, content } = req.body;
  if (!file || !isSafePath(file) || !isFolderAllowed(path.dirname(file), req.user))
    return res.status(403).send('Forbidden (file access)');
  try {
    const oldContent = await fs.readFile(file, 'utf-8');
    await fs.writeFile(file, content, 'utf-8');
    logAudit(req.user, 'edit', file, oldContent, content);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to save file' });
  }
});

/* ───────────── UPLOAD/REPLACE MEDIA ───────────── */
router.post('/upload', requireWebEditAccess, upload.single('media'), async (req, res) => {
  const { destPath } = req.body;
  if (!destPath || !isSafePath(destPath) || !isFolderAllowed(path.dirname(destPath), req.user))
    return res.status(403).send('Forbidden (upload access)');
  try {
    await fs.copyFile(req.file.path, destPath);
    await fs.unlink(req.file.path);
    logAudit(req.user, 'upload', destPath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

/* ───────────── CREATE FILE/FOLDER ───────────── */
router.post('/create', requireWebEditAccess, async (req, res) => {
  const { folder, name, type } = req.body;
  const absFolder = path.resolve(folder);
  if (!isSafePath(absFolder) || !isFolderAllowed(absFolder, req.user))
    return res.status(403).send('Forbidden (folder access)');
  const newPath = path.join(absFolder, name);
  try {
    if (type === 'folder') {
      await fs.mkdir(newPath);
      logAudit(req.user, 'mkdir', newPath);
    } else {
      await fs.writeFile(newPath, '', 'utf-8');
      logAudit(req.user, 'create', newPath);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Create failed' });
  }
});

/* ───────────── DELETE FILE/FOLDER ───────────── */
router.post('/delete', requireWebEditAccess, async (req, res) => {
  const { target } = req.body;
  if (!target || !isSafePath(target) || !isFolderAllowed(path.dirname(target), req.user))
    return res.status(403).send('Forbidden (delete access)');
  try {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      await fs.rm(target, { recursive: true, force: true });
      logAudit(req.user, 'rmdir', target);
    } else {
      await fs.unlink(target);
      logAudit(req.user, 'delete', target);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

/* ───────────── AUDIT LOG ───────────── */
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

/* ───────────── UTIL: AUDIT LOGGER ───────────── */
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
// ── src/app.js ──────────────────────────────────────────────
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { sequelize } from './config/database.js';
import arContentRoutes from './routes/arContentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import AdminUser from './models/AdminUser.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import flash from 'connect-flash';
import adminManageRoutes from './routes/adminManageRoutes.js';
import webeditRoutes from './routes/webeditRoutes.js';
import passport from './config/passport.js';
import { renderWebedit } from './utils/webeditRender.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

/* ── Middleware ─────────────────────────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": [
          "'self'",
          "'unsafe-eval'",
          "aframe.io",
          "cdn.jsdelivr.net",
          "unpkg.com",
          "raw.githack.com",
          "blob:",
          "overbridgenet.com"
        ],
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://overbridgenet.com"
        ],
      },
    },
  })
);
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super‑secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* ── Static folders (public/) ──────────────────────────── */
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/targets', express.static(path.join(__dirname, '../public/targets')));
app.use('/qr', express.static(path.join(__dirname, '../public/qr')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/vendor', express.static(path.join(__dirname, '../public/vendor')));
app.use('/viewCss', express.static(path.join(__dirname, 'views/viewCss')));
app.use('/viewJs', express.static(path.join(__dirname, 'views/viewJs')));
app.use('/website', express.static(path.join(__dirname, 'views/website')));
app.use('/webedit/css', express.static(path.join(__dirname, 'webedit/css')));
app.use('/webedit/js', express.static(path.join(__dirname, 'webedit/js')));

/* ── View engine (EJS) ─────────────────────────────────── */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* ── Secure admin-only middleware for webedit ───────────── */
async function ensureAdminAuthenticated(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    req.flash('error', 'Please log in as an approved admin.');
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
    req.flash('error', 'You are not authorized to access this page.');
    return res.redirect('/webedit/login');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Authentication failed.');
    return res.redirect('/webedit/login');
  }
}

/* ── Core and dashboard/admin routes ───────────────────── */
app.use('/dashboard/admins', adminManageRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api', arContentRoutes);
app.use('/admins', adminRoutes);
app.use('/', arContentRoutes);

/* ── Website public routes ─────────────────────────────── */
app.get('/website/', (req, res) => {
  res.render('website/index');
});

app.get('/website/ar-admins', async (req, res) => {
  try {
    const arAdmins = await AdminUser.findAll({
      where: {
        isApproved: true,
        locked: false
      },
      attributes: ['fullName', 'email', 'phone', 'country', 'city']
    });
    res.render('website/ar-admins', { arAdmins });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load AR admins.');
    res.render('website/ar-admins', { arAdmins: [] });
  }
});

app.get('/website/register-admin', (req, res) => {
  res.render('website/register-admin');
});

app.post('/website/register-admin', async (req, res) => {
  const { fullName, email, phone, country, city, username, password } = req.body;
  try {
    const existing = await AdminUser.findOne({ where: { email } });
    if (existing) {
      req.flash('error', 'Email already registered.');
      return res.redirect('/website/register-admin');
    }
    await AdminUser.create({
      fullName,
      email,
      phone,
      country,
      city,
      username,
      password,
      isApproved: false,
      locked: false
    });
    req.flash('success', 'Registration submitted! Await approval by main admin.');
    res.redirect('/website/register-admin');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/website/register-admin');
  }
});

/* ── Webedit login/logout/dashboard routes ──────────────── */
// GET login page for webedit (renders from src/webedit/webedit-login.ejs)
app.get('/webedit/login', (req, res) => {
  renderWebedit(res, 'webedit-login', {
    error: res.locals.error,
    success: res.locals.success
  });
});

// POST login for webedit (Passport)
app.post('/webedit/login',
  (req, res, next) => {
    if (req.user) return res.redirect('/webedit/editor-dashboard');
    next();
  },
  passport.authenticate('local', {
    failureRedirect: '/webedit/login',
    failureFlash: true
  }),
  (req, res) => {
    // DEBUG: show user after login
    console.log('User after login:', req.user);
    if (
      req.user && (
        req.user.username === 'admin' ||
        req.user.isMainAdmin === true ||
        req.user.canWebEdit === true ||
        req.user.isAuthorised === true ||
        (req.user.isApproved === true && req.user.locked === false)
      )
    ) {
      res.redirect('/webedit/editor-dashboard');
    } else {
      req.logout(() => {});
      req.flash('error', 'Access denied.');
      renderWebedit(res, 'webedit-login', {
        error: ['Access denied.'],
        success: []
      });
    }
  }
);

app.get('/webedit/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/webedit/login');
    });
  });
});

app.get('/webedit', (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect('/webedit/login');
  }
  return res.redirect('/webedit/editor-dashboard');
});

// Protected dashboard for webedit (renders from src/webedit/editor-dashboard.ejs)
app.get('/webedit/editor-dashboard', ensureAdminAuthenticated, async (req, res) => {
  // Match webeditRoutes.js SAFE_ROOTS!
  const SAFE_ROOTS = [
    path.resolve(__dirname, 'views'),
    path.resolve(__dirname, '../public')
  ];
  const folder = SAFE_ROOTS[0];
  try {
    const files = await fsPromises.readdir(folder, { withFileTypes: true });
    renderWebedit(res, 'editor-dashboard', {
      user: req.user,
      folder,
      files,
      SAFE_ROOTS,
      path, // <--- pass path module
      encodeURIComponent // <--- pass encodeURIComponent function
    });
  } catch (e) {
    renderWebedit(res, 'editor-dashboard', {
      user: req.user,
      folder,
      files: [],
      SAFE_ROOTS,
      error: ['Failed to read folder'],
      path,
      encodeURIComponent
    });
  }
});

// Attach the rest of webedit routes (must be last for /webedit/*)
app.use('/webedit', webeditRoutes);

/* ── Health check ─────────────────────────────────────── */
app.get('/', (_req, res) => res.send('AR Business Server 2.1 – OK'));

/* ── Error handler ────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (res.headersSent) return next(err);
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  req.flash('error', 'An unexpected error occurred. Please try again.');
  res.redirect('back');
});

/* ── Start server ─────────────────────────────────────── */
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQL Server connection OK');
    await sequelize.sync();
    console.log('🔄 Models synchronized');
    const adminCount = await AdminUser.count();
    if (adminCount === 0) {
      await AdminUser.create({
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Main Admin',
        phone: '+0000000000',
        country: 'YourCountry',
        city: 'YourCity',
        username: 'admin',
        isApproved: true,
        locked: false,
        isMainAdmin: true,
        canWebEdit: true,
        isAuthorised: true
      });
      console.log('✅ Default admin user created: admin@example.com');
    }
    const APP_PORT = process.env.PORT || 5000;
    app.listen(APP_PORT, () =>
      console.log(`🚀 Server listening on http://localhost:${APP_PORT}`)
    );
    console.log('DEBUG: process.env.PORT =', process.env.PORT);
  } catch (e) {
    console.error('❌ DB connection failed:', e);
    process.exit(1);
  }
})();
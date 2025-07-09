// ── src/app.js ──────────────────────────────────────────────
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { sequelize } from './config/database.js';
import arContentRoutes from './routes/arContentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import AdminUser from './models/AdminUser.js'; // ensures model is registered
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import flash from 'connect-flash';
import adminManageRoutes from './routes/adminManageRoutes.js';
import webeditRoutes from './routes/webeditRoutes.js';
import passport from './config/passport.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

/* Session middleware (stores auth login) */
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super‑secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.use(flash()); // <-- Place immediately after session!

// Passport.js initialization (after session)
app.use(passport.initialize());
app.use(passport.session());

// Make flash messages available in all templates
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
// For legacy view assets
app.use('/viewCss', express.static(path.join(__dirname, 'views/viewCss')));
app.use('/viewJs', express.static(path.join(__dirname, 'views/viewJs')));

// Serve static files for website UI (css/js)
app.use('/website', express.static(path.join(__dirname, 'views/website')));

// Serve static files for webedit UI (css/js) -- for login, dashboard, etc
app.use('/webedit/css', express.static(path.join(__dirname, 'webedit/css')));
app.use('/webedit/js', express.static(path.join(__dirname, 'webedit/js')));

/* ── View engine (EJS) ─────────────────────────────────── */
// For legacy routes (dashboard, etc.): views directory is src/views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* --- Webedit-specific EJS rendering: set views to src/webedit for webedit routes --- */
const webeditViews = path.join(__dirname, 'webedit');

/* ── Secure admin-only middleware for webedit ───────────── */
/**
 * Only allow:
 *  - Main admin (username: 'admin')
 *  - Other admins who are isApproved === true and locked === false
 *  - Must be logged in
 */
async function ensureAdminAuthenticated(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    req.flash('error', 'Please log in as an approved admin.');
    return res.redirect('/webedit/login');
  }
  try {
    // Fetch fresh user from database for the latest status
    const user = await AdminUser.findByPk(req.user.id);
    if (
      user && (
        user.username === 'admin' ||
        (user.isApproved === true && user.locked === false)
      )
    ) {
      req.user = user; // Update user in request
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
app.use('/webedit', webeditRoutes);
app.use('/auth', authRoutes); // login / logout / register
app.use('/dashboard', dashboardRoutes);
app.use('/api', arContentRoutes); // JSON CRUD
app.use('/admins', adminRoutes);
app.use('/', arContentRoutes); // /card/:slug page

/* ── Website public routes ─────────────────────────────── */
app.get('/website/', (req, res) => {
  res.render('website/index');
});

app.get('/website/ar-admins', async (req, res) => {
  try {
    // Only list admins who are approved and not locked/terminated, for public listing
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
  // Basic form data: fullName, email, phone, country, city, username, password
  const { fullName, email, phone, country, city, username, password } = req.body;
  try {
    // Check if user/email already exists
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
      password, // You should hash password before saving in production!
      isApproved: false, // Main admin must approve new admins
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
// GET login page for webedit (renders from src/webedit/login.ejs)
app.get('/webedit/login', (req, res) => {
  res.render('login', {
    error: res.locals.error,
    success: res.locals.success
  }, { views: webeditViews });
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
    // Only allow main admin or isApproved
    if (req.user && (req.user.username === 'admin' || (req.user.isApproved && !req.user.locked))) {
      res.redirect('/webedit/editor-dashboard');
    } else {
      req.logout(() => {});
      req.flash('error', 'Access denied.');
      res.redirect('/webedit/login');
    }
  }
);

// Logout for webedit
app.get('/webedit/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/webedit/login');
    });
  });
});

// Protected dashboard for webedit (renders from src/webedit/editor-dashboard.ejs)
app.get('/webedit/editor-dashboard', ensureAdminAuthenticated, (req, res) => {
  res.render('editor-dashboard', { user: req.user }, { views: webeditViews });
});

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
        password: 'password123', // Change this in .env for security
        fullName: 'Main Admin',
        phone: '+0000000000',
        country: 'YourCountry',
        city: 'YourCity',
        username: 'admin',
        isApproved: true,
        locked: false
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

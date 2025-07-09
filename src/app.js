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
import passport from './config/passport.js'; // <-- Add passport import

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const path = require('path');

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
app.use('/viewCss', express.static(path.join(__dirname, 'views/viewCss')));
app.use('/viewJs', express.static(path.join(__dirname, 'views/viewJs')));

// NEW: Serve static files for website UI (css/js)
app.use('/website', express.static(path.join(__dirname, 'views/website')));
// for managing admins
app.use('/dashboard/admins', adminManageRoutes);
app.use('/webedit', webeditRoutes);

/* ── View engine (EJS) ─────────────────────────────────── */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


/* ── Website public routes ─────────────────────────────── */
app.get('/website/', (req, res) => {
  res.render('website/index', { /* any variables here */ });
});

app.get('/website/ar-admins', async (req, res) => {
  try {
    // Only list admins who are approved and not locked/terminated, for public listing
    const arAdmins = await AdminUser.findAll({
      where: {
        isApproved: true,
        locked: false
      },
      attributes: ['fullName', 'email', 'phone', 'country', 'city'] // update as per your model
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

app.get('/webedit/editor-dashboard', (req, res) => {
  res.render('webedit/editor-dashboard'); // Pass variables as second argument if needed
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

/* ── Main app routes ───────────────────────────────────── */
app.use('/auth', authRoutes); // login / logout / register
app.use('/dashboard', dashboardRoutes);
app.use('/api', arContentRoutes); // JSON CRUD
app.use('/admins', adminRoutes);
app.use('/', arContentRoutes); // /card/:slug page

/* ── Health check ─────────────────────────────────────── */
app.get('/', (_req, res) => res.send('AR Business Server 2.1 – OK'));

/* ── Error handler ────────────────────────────────────── */
// General error handler for JSON APIs and other errors
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
  } catch (e) {
    console.error('❌ DB connection failed:', e);
    process.exit(1);
  }
})();
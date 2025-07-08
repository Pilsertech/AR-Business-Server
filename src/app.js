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
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.use(flash()); // <-- Place immediately after session!

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

/* ── View engine (EJS) ─────────────────────────────────── */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* ── Routes ────────────────────────────────────────────── */
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
  // If response is already sent, delegate to default Express handler
  if (res.headersSent) return next(err);
  // If it's an AJAX/JSON request, send JSON error
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  // Otherwise, flash error and redirect back
  req.flash('error', 'An unexpected error occurred. Please try again.');
  res.redirect('back');
});

/* ── Start server ─────────────────────────────────────── */
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQL Server connection OK');

    // Ensure tables exist and are up to date
    await sequelize.sync();
    console.log('🔄 Models synchronized');

    // Create default admin user if none exist
    const adminCount = await AdminUser.count();
    if (adminCount === 0) {
      await AdminUser.create({
        email: 'admin@example.com',
        password: 'password123', // Change this in .env for security
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
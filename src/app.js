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
          "'self'", // Allows scripts from our own server (like form-logic.js)
          "'unsafe-eval'", // Required by A-Frame/AR.js
          "aframe.io",
          "cdn.jsdelivr.net",
          "unpkg.com",
          "raw.githack.com",
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
      secure: process.env.NODE_ENV === 'production', // true only behind HTTPS
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.use(express.json());
// It parses URL-encoded bodies from HTML forms
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* ── Static folders (public/) ──────────────────────────── */
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/targets', express.static(path.join(__dirname, '../public/targets')));
app.use('/qr', express.static(path.join(__dirname, '../public/qr')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));

/* ── View engine (EJS) ─────────────────────────────────── */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* ── Routes ────────────────────────────────────────────── */
app.use('/auth', authRoutes); // login / logout / register
app.use('/dashboard', dashboardRoutes);
app.use('/api', arContentRoutes); // JSON CRUD
app.use('/', arContentRoutes); // /card/:slug page

/* ── Health check ─────────────────────────────────────── */
app.get('/', (_req, res) => res.send('AR Business Server 2.1 – OK'));

/* ── Error handler ────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ── Start server ─────────────────────────────────────── */
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQL Server connection OK');

      // This makes sure the `admin_users` table exists before you try to add to it.
    
      //This below line  command might work in other databases like MySQL, it is invalid syntax for Microsoft SQL Server, SO I COMMENTED IT FOR FUTURE USE
      //await sequelize.sync({ alter: true });
     //instead this bellow 
     await sequelize.sync();

     console.log('🔄 Models synchronized');

    
     // This runs *after* the tables are confirmed to exist.
     const adminCount = await AdminUser.count();
     if (adminCount === 0) {
       // This part only runs if the `admin_users` table is empty.
       await AdminUser.create({
        email: 'admin@example.com',
        password: 'password123', // Change this in  .env file for security
      });
      console.log('✅ Default admin user created: admin@example.com');
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server listening on http://localhost:${PORT}`)
    );
  } catch (e) {
    console.error('❌ DB connection failed:', e);
    process.exit(1);
  }
})();
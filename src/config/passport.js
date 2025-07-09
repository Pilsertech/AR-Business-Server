// ── src/config/passport.js ──────────────────────────────
// This configures Passport.js for local strategy login using email & password
// and sets up session serialization for admin users.

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import AdminUser from '../models/AdminUser.js';

// Local strategy for username/password login
passport.use(new LocalStrategy(
  {
    usernameField: 'email',    // use 'email' field instead of default 'username'
    passwordField: 'password'  // use 'password' field
  },
  async (email, password, done) => {
    try {
      // Find user by email
      const user = await AdminUser.findOne({ where: { email } });
      if (!user) return done(null, false, { message: 'Incorrect email.' });
      if (user.locked) return done(null, false, { message: 'Account locked.' });

      // Validate password (you must define isValidPassword on AdminUser)
      if (!(await user.isValidPassword(password))) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      // Success: pass user object to next step
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize user.id into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user by id from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await AdminUser.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import AdminUser from '../models/AdminUser.js';

// Local strategy for username/password login
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await AdminUser.findOne({ where: { email } });
    if (!user) return done(null, false, { message: 'Incorrect email.' });
    if (user.locked) return done(null, false, { message: 'Account locked.' });
    if (!(await user.isValidPassword(password))) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize user ID to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user ID from session and fetch user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await AdminUser.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
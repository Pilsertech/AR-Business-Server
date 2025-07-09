import AdminUser from '../src/models/AdminUser.js';
import '../src/config/database.js'; // Ensure DB connection is established

async function resetMainAdmin() {
  // 1. Remove any user with the admin email (in case they exist)
  await AdminUser.destroy({ where: { email: 'admin@example.com' } });

  // 2. Remove all existing main admins (in case their email is different)
  await AdminUser.destroy({ where: { isMainAdmin: true } });

  // 3. Create the new main admin
  await AdminUser.create({
    email: 'admin@example.com',
    password: 'passward123', // Will be hashed by model hook
    isMainAdmin: true,
    locked: false,
    username: 'Main Admin'
  });

  console.log('Main admin reset successfully!');
}

resetMainAdmin().then(() => process.exit(0));